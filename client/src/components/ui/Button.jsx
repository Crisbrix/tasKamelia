import { motion } from 'framer-motion';

const variants = {
  primary:
    'bg-zinc-50 text-zinc-900 hover:bg-white focus-visible:ring-white/40 light:bg-zinc-900 light:text-white light:hover:bg-zinc-800 light:focus-visible:ring-black/30',
  accent: 'bg-white text-night-950 hover:bg-zinc-200 focus-visible:ring-white/40 light:bg-zinc-900 light:text-white light:hover:bg-zinc-700',
  outline:
    'border border-white/[0.1] bg-night-900 text-zinc-200 hover:bg-night-800 hover:text-white focus-visible:ring-white/25 light:border-black/[0.1] light:bg-white light:text-zinc-800 light:hover:bg-zinc-50',
  ghost: 'text-zinc-300 hover:bg-white/[0.07] hover:text-white focus-visible:ring-white/25 light:text-zinc-600 light:hover:bg-black/5 light:hover:text-zinc-900',
  success: 'bg-neon-green text-white hover:bg-emerald-600 focus-visible:ring-neon-green/40',
  danger: 'bg-kamelia-deep text-white hover:bg-rose-700 focus-visible:ring-kamelia/40',
  brand: 'bg-kamelia-deep text-white hover:bg-rose-700 focus-visible:ring-kamelia/40',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-9 w-9 p-0',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <motion.button
            whileTap={props.disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
