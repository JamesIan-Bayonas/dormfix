import crypto from 'crypto';
import type { Server, Socket } from 'socket.io';
import { findSession, type SessionActor } from '../middleware/session';
import { conversationFor, canSeePresence } from './chatAccess';
import { chatRepository } from '../repositories/chatRepository';

export function configureSecureSockets(io: Server) {
    const online = new Map<string,Set<string>>();
    const muted = new Set<string>();
    io.use(async (socket,next) => {
        try {
            const actor=await findSession(socket.handshake.auth?.token);
            if (!actor || !(actor.role === 'landlord' || actor.role === 'tenant' && actor.isApproved)) return next(new Error('Sign in again to connect to messages.'));
            socket.data.actor=actor;next();
        } catch { next(new Error('Session verification is unavailable.')); }
    });
    async function fresh(socket: Socket) {
        const actor=await findSession(socket.handshake.auth?.token);
        if (!actor || !(actor.role==='landlord'||actor.role==='tenant'&&actor.isApproved)) { socket.disconnect(true);return null; }
        return actor;
    }
    async function deliver(roomId: string, event: string, payload: unknown) {
        for(const peer of await io.in(roomId).fetchSockets()){
            const actor=await findSession(peer.handshake.auth?.token);
            if (actor && await conversationFor(actor,roomId)) peer.emit(event,payload);
            else { await peer.leave(roomId);if(!actor)peer.disconnect(true); }
        }
    }
    async function presence(userId: string) {
        for(const peer of io.sockets.sockets.values()){
            const current=await findSession(peer.handshake.auth?.token);
            if(current && await canSeePresence(current,userId)) peer.emit('user_presence_update',{userId,isOnline:!!online.get(userId)?.size,lastSeen:new Date().toISOString()});
        }
    }
    io.on('connection',socket=>{
        const actor=socket.data.actor as SessionActor;
        const sockets=online.get(actor.id)||new Set<string>();sockets.add(socket.id);online.set(actor.id,sockets);
        const expiry=setTimeout(()=>socket.disconnect(true),Math.max(1,new Date(actor.expiresAt!).getTime()-Date.now()));expiry.unref();
        const failure=()=>socket.emit('chat_error',{message:'This action is unavailable for your session or conversation.'});
        socket.use(async (_packet,next)=>{try{if(await fresh(socket))next();else next(new Error('Session expired.'));}catch{next(new Error('Session verification unavailable.'));}});
        socket.on('register_user',async userId=>{
            if(userId!==actor.id){failure();return;}
            try{await chatRepository.updateUserLastSeen(actor.id);await presence(actor.id);}catch{failure();}
        });
        socket.on('join_room',async roomId=>{
            try{const current=await fresh(socket);if(!current||!await conversationFor(current,roomId)){failure();return;}await socket.join(roomId);}catch{failure();}
        });
        socket.on('check_presence',async peerId=>{
            try{const current=await fresh(socket);if(!current||!await canSeePresence(current,peerId)){failure();return;}
                socket.emit('presence_status',{userId:peerId,isOnline:!!online.get(peerId)?.size});
            }catch{failure();}
        });
        socket.on('send_message',async data=>{
            try {
                const current=await fresh(socket);if(!current||!data||typeof data.text!=='string'||!data.text.trim()||data.text.length>10000){failure();return;}
                const room=await conversationFor(current,data.roomId);if(!room){failure();return;}
                const recipient=current.role==='landlord'?room.tenantId:room.landlordId;
                if(data.senderId!==current.id||data.role!==current.role||(data.recipientId!==undefined&&data.recipientId!==recipient)||(current.role==='tenant'&&muted.has(data.roomId))){failure();return;}
                const id=crypto.randomUUID(),text=data.text.trim();
                await chatRepository.saveMessage(id,data.roomId,current.id,recipient,current.role,text);
                await deliver(data.roomId,'receive_message',{id,roomId:data.roomId,senderId:current.id,recipientId:recipient,role:current.role,text,timestamp:new Date().toISOString()});
            } catch { socket.emit('chat_error',{message:'Message saving could not be confirmed. Refresh history before retrying.'}); }
        });
        socket.on('toggle_mute',async data=>{
            try{const current=await fresh(socket);if(!current||current.role!=='landlord'||!data||typeof data.status!=='boolean'||!await conversationFor(current,data.roomId)){failure();return;}
                if(data.status)muted.add(data.roomId);else muted.delete(data.roomId);
                await deliver(data.roomId,'chat_error',{message:data.status?'Communication capabilities restricted by property management.':'Communication capabilities restored.'});
            }catch{failure();}
        });
        socket.on('disconnect',()=>{
            clearTimeout(expiry);const active=online.get(actor.id);active?.delete(socket.id);if(!active?.size)online.delete(actor.id);
            void chatRepository.updateUserLastSeen(actor.id).then(()=>presence(actor.id)).catch(()=>{});
        });
    });
}
