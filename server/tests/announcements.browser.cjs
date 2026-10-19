/* Run the --serve integration fixture and Vite first. Supply Playwright via
   DORMFIX_PLAYWRIGHT_MODULE if it is not installed in the invoking environment. */
const { chromium } = require(process.env.DORMFIX_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const frontend = process.env.DORMFIX_PREVIEW_URL || 'http://127.0.0.1:5179';
const backend = 'http://127.0.0.1:5018';
const screenshots = path.resolve(__dirname,'../../docs/screenshots');
const checks=[];
(async()=>{
    const browser=await chromium.launch({headless:true,channel:'msedge'});
    const errors=[];
    let failReads=false,failWrites=false,failRooms=false;
    async function makePage(user) {
        const context=await browser.newContext({viewport:{width:1440,height:1000}});
        if(user)await context.addInitScript(record=>localStorage.setItem('dormfixUser',JSON.stringify(record)),user);
        await context.route('**/socket.io/**',r=>r.abort());
        await context.route('**/api/**',async route=>{
            const request=route.request(),url=new URL(request.url());
            if(!url.pathname.startsWith('/api/'))return route.continue();
            if(failRooms&&url.pathname.startsWith('/api/landlord/rooms/'))return route.fulfill({status:503,json:{error:'Fixture room read failure'}});
            if(url.pathname==='/api/announcements'&&((failReads&&request.method()==='GET')||(failWrites&&request.method()==='POST')))return route.fulfill({status:503,json:{error:'Temporary fixture failure. Your draft is retained.'}});
            if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,PATCH,OPTIONS'}});
            const response=await fetch(backend+url.pathname+url.search,{method:request.method(),headers:{'Content-Type':'application/json',...(request.headers().authorization?{Authorization:request.headers().authorization}:{})},...(['GET','HEAD'].includes(request.method())?{}:{body:request.postData()||undefined})});
            await route.fulfill({status:response.status,body:Buffer.from(await response.arrayBuffer()),headers:{'content-type':'application/json','access-control-allow-origin':'*'}});
        });
        const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));return page;
    }
    async function loginRecord(id){const r=await fetch(backend+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:id+'@example.invalid',password:'TEST-ONLY-password'})});assert.equal(r.status,200);return r.json();}
    const landlord=await makePage();await landlord.goto(frontend,{waitUntil:'domcontentloaded'});
    await landlord.getByLabel('Email address',{exact:true}).fill('l1@example.invalid');await landlord.getByLabel('Password',{exact:true}).fill('TEST-ONLY-password');
    await landlord.getByRole('button',{name:'Sign in',exact:true}).click();
    await landlord.getByRole('navigation',{name:'Landlord navigation'}).getByRole('link',{name:'Announcements',exact:true}).click();
    await landlord.getByRole('heading',{name:'Announcements',exact:true}).waitFor();
    const editor=()=>landlord.getByRole('dialog',{name:/^(New|Edit) announcement$/});
    await landlord.getByRole('button',{name:'New announcement',exact:true}).click();
    await editor().getByLabel('Title',{exact:true}).fill('Room 100 inspection');
    await editor().getByLabel('Details',{exact:true}).fill('Please keep the entrance accessible tomorrow morning.');
    await editor().getByLabel('Audience',{exact:true}).selectOption('100');
    await editor().getByLabel('Importance',{exact:true}).selectOption('important');
    await editor().getByRole('button',{name:'Save draft',exact:true}).click();
    await landlord.getByLabel('Show announcements',{exact:true}).selectOption('Draft');
    await landlord.getByRole('heading',{name:'Room 100 inspection',exact:true}).waitFor();
    const tenant=await makePage(await loginRecord('t1'));await tenant.goto(frontend,{waitUntil:'domcontentloaded'});
    await tenant.getByRole('heading',{name:'No current announcements',exact:true}).waitFor();
    assert.equal(await tenant.getByText('Room 100 inspection',{exact:true}).count(),0);
    checks.push('actual login creates session; saved draft is not visible to tenants');
    await landlord.getByRole('button',{name:'Edit draft',exact:true}).click();await editor().getByRole('button',{name:'Publish announcement',exact:true}).click();
    await landlord.getByLabel('Show announcements',{exact:true}).selectOption('current');await landlord.getByRole('heading',{name:'Room 100 inspection',exact:true}).waitFor();
    await landlord.getByRole('button',{name:'New announcement',exact:true}).click();
    await editor().getByLabel('Title',{exact:true}).fill('Shared laundry maintenance');await editor().getByLabel('Details',{exact:true}).fill('The laundry area will reopen after maintenance.');
    failWrites=true;await editor().getByRole('button',{name:'Publish announcement',exact:true}).click();await editor().getByRole('alert').waitFor();assert.equal(await editor().getByLabel('Title',{exact:true}).inputValue(),'Shared laundry maintenance');
    failWrites=false;await editor().getByRole('button',{name:'Publish announcement',exact:true}).click();await landlord.getByRole('heading',{name:'Shared laundry maintenance',exact:true}).waitFor();
    checks.push('draft publication, all-tenant audience, and form retention after failed save');
    await tenant.reload({waitUntil:'domcontentloaded'});await tenant.getByRole('heading',{name:'Room 100 inspection',exact:true}).waitFor();
    const titles=await tenant.getByRole('region',{name:'Dorm announcements',exact:true}).locator('article h3').allTextContents();assert.deepEqual(titles,['Room 100 inspection','Shared laundry maintenance']);
    const otherRoom=await makePage(await loginRecord('t2'));await otherRoom.goto(frontend,{waitUntil:'domcontentloaded'});await otherRoom.getByRole('heading',{name:'Shared laundry maintenance',exact:true}).waitFor();assert.equal(await otherRoom.getByRole('heading',{name:'Room 100 inspection',exact:true}).count(),0);
    const otherDorm=await makePage(await loginRecord('t3'));await otherDorm.goto(frontend,{waitUntil:'domcontentloaded'});await otherDorm.getByRole('heading',{name:'No current announcements',exact:true}).waitFor();
    checks.push('important-first home ordering and real API room/dorm isolation');
    await landlord.locator('article').filter({has:landlord.getByRole('heading',{name:'Room 100 inspection',exact:true})}).getByRole('button',{name:'Edit announcement',exact:true}).click();
    await editor().getByLabel('Details',{exact:true}).fill('Updated: inspection is in the afternoon.');await editor().getByRole('button',{name:'Save published changes',exact:true}).click();
    await tenant.getByRole('link',{name:'View all announcements',exact:true}).click();await tenant.getByText('Updated: inspection is in the afternoon.',{exact:true}).waitFor();
    const target=landlord.locator('article').filter({has:landlord.getByRole('heading',{name:'Room 100 inspection',exact:true})});
    await target.getByRole('button',{name:'Archive',exact:true}).click();await landlord.getByRole('dialog',{name:'Archive announcement?',exact:true}).getByRole('button',{name:'Archive announcement',exact:true}).click();
    await tenant.getByRole('button',{name:'Refresh',exact:true}).click();await tenant.getByRole('heading',{name:'Shared laundry maintenance',exact:true}).waitFor();assert.equal(await tenant.getByRole('heading',{name:'Room 100 inspection',exact:true}).count(),0);
    await tenant.getByLabel('Show announcements',{exact:true}).selectOption('history');await tenant.getByRole('heading',{name:'Room 100 inspection',exact:true}).waitFor();await tenant.getByText('Archived',{exact:true}).waitFor();
    checks.push('editing published notices, archive confirmation, removal from current notices, preserved tenant history');
    for(const page of [landlord,tenant])for(const width of [1440,768,390,320]){
        await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await tenant.getByLabel('Appearance',{exact:true}).selectOption('dark');await tenant.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
    fs.mkdirSync(screenshots,{recursive:true});await tenant.screenshot({path:path.join(screenshots,'announcements-tenant-dark-mobile.png'),fullPage:true});
    await landlord.setViewportSize({width:1440,height:1000});await landlord.getByLabel('Show announcements',{exact:true}).selectOption('all');await landlord.screenshot({path:path.join(screenshots,'announcements-landlord-desktop.png'),fullPage:true});
    failReads=true;await tenant.getByRole('button',{name:'Refresh',exact:true}).click();await tenant.getByRole('heading',{name:'Announcements unavailable',exact:true}).waitFor();failReads=false;await tenant.getByRole('button',{name:'Retry announcements',exact:true}).click();await tenant.getByRole('heading',{name:'Shared laundry maintenance',exact:true}).waitFor();
    checks.push('320px reflow, dark theme, and read failure/retry');
    failRooms=true;
    const roomFailure=await makePage(await loginRecord('l1'));await roomFailure.goto(frontend+'/announcements',{waitUntil:'domcontentloaded'});
    await roomFailure.getByRole('button',{name:'New announcement',exact:true}).click();
    await roomFailure.getByRole('button',{name:'Retry rooms',exact:true}).waitFor();
    assert.ok(await roomFailure.getByLabel('Audience',{exact:true}).isEnabled());assert.equal(await roomFailure.getByLabel('Audience',{exact:true}).inputValue(),'');failRooms=false;
    const legacy=await loginRecord('t1');delete legacy.accessToken;
    const oldSession=await makePage(legacy);await oldSession.goto(frontend,{waitUntil:'domcontentloaded'});await oldSession.getByRole('heading',{name:'Sign-in required for announcements',exact:true}).waitFor();
    checks.push('room read failure retains all-tenant audience; older saved sign-ins receive an explicit reauthentication state');
    await landlord.getByRole('button',{name:'Sign out',exact:true}).click();await landlord.getByRole('button',{name:'Sign in',exact:true}).waitFor();
    assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,runtimeErrors:errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
