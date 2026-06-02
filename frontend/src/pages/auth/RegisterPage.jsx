import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuth, clearError } from '../../store/slices/authSlice';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'customer']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(selectAuth);
  const [showPass, setShowPass] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' },
  });

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const onSubmit = async (data) => {
    const { confirmPassword, ...payload } = data;
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Please sign in.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navyDeep relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#7dad3f 1px, transparent 1px), linear-gradient(90deg, #7dad3f 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-64 h-64 rounded-full border border-neon/20 absolute top-20 -right-20"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="w-48 h-48 rounded-full border border-neon/15 absolute bottom-20 -left-12"
        />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 overflow-hidden flex items-center justify-center bg-transparent">
              <img src="/favicon.png" alt="Aroma B2B" className="w-full h-full object-contain scale-[4.5]" />
            </div>
            <span className="font-display font-bold text-white text-2xl">
              Aroma <span className="text-neon">B2B</span>
            </span>
          </div>
          <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
            Join the platform.<br />
            <span className="text-neon">Grow your business.</span>
          </h2>
          <p className="text-grayLight text-lg max-w-sm mx-auto">
            Create your account and start managing inventory, sales, and purchases in minutes.
          </p>
        </div>
      </div>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 overflow-hidden flex items-center justify-center bg-transparent">
              <img src="/favicon.png" alt="Aroma B2B" className="w-full h-full object-contain scale-[4]" />
            </div>
            <span className="font-display font-bold text-navy text-xl">Aroma B2B</span>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl text-navy mb-1">Create account</h1>
              <p className="text-gray text-sm">Fill in your details to get started.</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
                  <input {...register('name')} placeholder="Your full name" className={cn('input-base !pl-10', errors.name && 'border-red-400')} />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
                  <input {...register('email')} type="email" placeholder="you@example.com" className={cn('input-base !pl-10', errors.email && 'border-red-400')} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Role <span className="text-red-500">*</span></label>
                <select {...register('role')} className="input-base">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
                  <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" className={cn('input-base !pl-10 pr-10', errors.password && 'border-red-400')} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-grayMid">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayMid" />
                  <input {...register('confirmPassword')} type="password" placeholder="Repeat password" className={cn('input-base !pl-10', errors.confirmPassword && 'border-red-400')} />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                {loading ? 'Creating account...' : (<>Create Account <ArrowRight size={16} /></>)}
              </button>
            </form>

            <p className="text-center text-sm text-gray mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-navy font-semibold hover:text-neon transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
