// import React, { useState } from 'react';
// import { useAuth } from './UserContext'; // Import the useAuth hook
// import type { UserRole } from '../types/types'; // Corrected path
// import { Home, Mail, Lock, Eye, EyeOff, User, Users } from 'lucide-react';

// const Login: React.FC = () => {
//   const { user, login } = useAuth(); // Destructure login function and user state

//   // State for form inputs from your logic
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState(''); // Added password state
//   const [role, setRole] = useState<UserRole>('tenant'); // Default role
  
//   // State for UI
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
    
//     // Simulate API call delay
//     setTimeout(() => {
//       login(email, role); // Call the login function from your context
//       // Note: Real login would happen here, then call login() on success
//       setIsLoading(false); 
//     }, 1500);
//   };

//   // If the user is logged in, show a welcome message
//   // This is a simple redirect/welcome. You'd typically show a dashboard.
//   if (user) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
//         <div className="p-4 bg-green-100 rounded-full mb-4">
//           <User size={48} className="text-green-700" />
//         </div>
//         <h2 className="text-3xl font-bold text-slate-900 mb-2">
//           Welcome, {user.name}!
//         </h2>
//         <p className="text-lg text-slate-600">
//           You are logged in as a {user.role}.
//         </p>
//         <p className="mt-4 text-slate-500">Redirecting to your dashboard...</p>
//       </div>
//     );
//   }

//   // If not logged in, show the merged Login screen
//   return (
//     <div className="flex min-h-screen">
//       {/* LEFT SIDE - Visual / Branding */}
//       <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden justify-center items-center">
//         <div className="absolute inset-0 bg-linear-to-br from-indigo-600/90 to-slate-900/90 z-10" />
//         <img 
//           src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
//           alt="Dormitory Building" 
//           className="absolute inset-0 w-full h-full object-cover opacity-50"
//         />
        
//         <div className="relative z-20 text-white max-w-md px-8 text-center">
//           <div className="mb-6 flex justify-center">
//             <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
//                <Home size={48} className="text-indigo-300" />
//             </div>
//           </div>
//           <h1 className="text-4xl font-bold mb-4 tracking-tight">DormFix</h1>
//           <p className="text-lg text-indigo-100 font-light leading-relaxed">
//             Streamlining student housing with efficiency, transparency, and accountability.
//           </p>
//         </div>
//       </div>

//       {/* RIGHT SIDE - Login Form */}
//       <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white">
//         <div className="w-full max-w-sm space-y-8">
          
//           <div className="text-center lg:text-left">
//             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome</h2>
//             <p className="mt-2 text-sm text-slate-500">
//               Please sign in to your DormFix account.
//             </p>
//           </div>

//           {/* This form now uses YOUR handleSubmit logic */}
//           <form onSubmit={handleSubmit} className="mt-8 space-y-6">
//             <div className="space-y-5">
              
//               {/* Email Input (from your logic) */}
//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
//                   Email address
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Mail size={18} className="text-slate-400" />
//                   </div>
//                   <input
//                     id="email"
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="e.g., tenant@dormfix.com"
//                     required
//                     className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white"
//                   />
//                 </div>
//               </div>

//               {/* Password Input (new, but standard) */}
//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Lock size={18} className="text-slate-400" />
//                   </div>
//                   <input
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     required
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white"
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Role Selector (from your logic) */}
//               <div>
//                 <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
//                   Login As
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Users size={18} className="text-slate-400" />
//                   </div>
//                   <select 
//                     id="role"
//                     value={role} 
//                     onChange={(e) => setRole(e.target.value as UserRole)}
//                     required
//                     className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white appearance-none"
//                   >
//                     <option value="tenant">Tenant</option>
//                     <option value="landlord">Landlord</option>
//                   </select>
//                 </div>
//               </div>

//             </div>

//             {/* Hint text from your logic, now styled */}
//             <p className='text-xs text-center text-slate-500 bg-slate-100 p-2 rounded-md'>
//               Try: <strong className="text-slate-700">tenant@dormfix.com</strong> (Tenant) or <strong className="text-slate-700">landlord@dormfix.com</strong> (Landlord)
//             </p>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <span className="flex items-center gap-2">
//                   <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Signing in...
//                 </span>
//               ) : (
//                 "Sign in"
//               )}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;