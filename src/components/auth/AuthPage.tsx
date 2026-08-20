import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = (data: LoginFormValues) => {
    login({ id: '1', username: data.email.split('@')[0], email: data.email });
    navigate('/');
  };

  const onRegister = (data: RegisterFormValues) => {
    login({ id: '1', username: data.username, email: data.email });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-app-base flex items-center justify-center p-4 font-sans text-app-text transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-app-panel rounded-2xl shadow-2xl overflow-hidden border border-app-border transition-colors duration-300"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-8 h-8 bg-app-accent rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <span className="text-app-text font-semibold tracking-tight text-xl">DevVault.io</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-app-text">
              Developer Workspace
            </h1>
            <p className="text-sm text-app-text-muted mt-2">
              Sign in to manage tasks and environments
            </p>
          </div>

          <div className="flex bg-black/5 p-1 rounded-lg mb-8 border border-app-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded transition-all ${
                isLogin
                  ? 'bg-app-accent shadow-sm text-white'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded transition-all ${
                !isLogin
                  ? 'bg-app-accent shadow-sm text-white'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                    <input
                      {...loginForm.register('email')}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-shadow outline-none text-app-text text-sm"
                      placeholder="developer@example.com"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-12 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-shadow outline-none text-app-text text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-bold py-2.5 rounded-lg transition-colors mt-6"
                >
                  Sign In
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                    <input
                      {...registerForm.register('username')}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-shadow outline-none text-app-text text-sm"
                      placeholder="johndoe"
                    />
                  </div>
                  {registerForm.formState.errors.username && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                    <input
                      {...registerForm.register('email')}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-shadow outline-none text-app-text text-sm"
                      placeholder="developer@example.com"
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                    <input
                      {...registerForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-12 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-shadow outline-none text-app-text text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-bold py-2.5 rounded-lg transition-colors mt-6"
                >
                  Create Account
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
