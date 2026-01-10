import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Create New User
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
      } else {
        // Login Existing User
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogle = () => signInWithPopup(auth, googleProvider);

  return (
    <div className="h-screen w-full bg-[#0E0E10] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1C1C1F] p-8 rounded-3xl border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-black text-qatar italic mb-2 text-center">DOHA EXPLORER</h1>
        <p className="text-white/40 text-center text-sm mb-8">
          {isSignUp ? 'Create an account to start exploring' : 'Welcome back, traveler'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input 
              type="text" placeholder="Full Name" 
              className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-qatar/50"
              onChange={(e) => setName(e.target.value)} required
            />
          )}
          <input 
            type="email" placeholder="Email Address" 
            className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-qatar/50"
            onChange={(e) => setEmail(e.target.value)} required
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-qatar/50"
            onChange={(e) => setPassword(e.target.value)} required
          />
          
          <button className="w-full bg-qatar py-3 rounded-xl font-bold hover:opacity-90 transition-all">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <hr className="border-white/5" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1C1C1F] px-4 text-xs text-white/20">OR</span>
        </div>

        <button onClick={handleGoogle} className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="G" />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-white/40">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-qatar font-bold hover:underline">
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;