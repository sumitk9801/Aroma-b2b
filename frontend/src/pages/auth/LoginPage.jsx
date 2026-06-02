import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuth, clearError } from '../../store/slices/authSlice';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const floatingShapes = [
  { size: 80, x: '10%', y: '20%', delay: 0 },
  { size: 120, x: '70%', y: '15%', delay: 0.5 },
  { size: 60, x: '80%', y: '65%', delay: 1 },
  { size: 100, x: '20%', y: '70%', delay: 0.3 },
  { size: 50, x: '50%', y: '45%', delay: 0.8 },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(selectAuth);
  const [showPass, setShowPass] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navyDeep relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Floating geometric shapes */}
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.15, 0.35, 0.15],
              scale: [1, 1.1, 1],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: shape.delay,
            }}
            className="absolute rounded-2xl border border-neon/30"
            style={{
              width: shape.size,
              height: shape.size,
              left: shape.x,
              top: shape.y,
              background: `rgba(125, 173, 63, 0.08)`,
            }}
          />
        ))}

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#7dad3f 1px, transparent 1px), linear-gradient(90deg, #7dad3f 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 ">
            <div className="w-20 h-20 overflow-hidden flex items-center justify-center bg-transparent">
              <img src="/favicon.png" alt="Aroma B2B" className="w-full h-full object-contain scale-[3]" />
            </div>
            <span className="font-display font-bold text-white text-2xl">
              Aroma <span className="text-neon">B2B</span>
            </span>
          </div>
          <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
            Manage smarter.<br />
            <span className="text-neon">Sell faster.</span>
          </h2>
          <p className="text-grayLight text-lg max-w-sm mx-auto">
            The all-in-one inventory and sales platform trusted by growing B2B businesses.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Products', value: '∞' },
              { label: 'Real-time', value: '✓' },
              { label: 'Reports', value: '6+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-display font-bold text-neon text-2xl">{stat.value}</p>
                <p className="text-grayLight text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 overflow-hidden flex items-center justify-center bg-transparent">
              <img src="/favicon.png" alt="Aroma B2B" className="w-full h-full object-contain scale-[4]" />
            </div>
            <span className="font-display font-bold text-navy text-xl">Aroma B2B</span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h1 className="font-display font-bold text-2xl text-navy mb-2">Sign in</h1>
              <p className="text-gray text-sm">Enter your credentials to access your dashboard.</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={cn('input-base !pl-10', errors.email && 'border-red-400 focus:border-red-400 focus:ring-red-400/40')}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn('input-base !pl-10 pr-10', errors.password && 'border-red-400')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grayMid hover:text-navy transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-navy font-semibold hover:text-neon transition-colors">
                Register
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
