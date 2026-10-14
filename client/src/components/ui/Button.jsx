import { motion } from 'framer-motion';

const variants = {
  primary:
    'bg-kamelia text-white shadow-glow-brand hover:bg-kamelia-soft focus-visible:ring-kamelia/50',
  accent: 'bg-white text-night-950 hover:bg-zinc-200 focus-visible:ring-white/40 light:bg-zinc-900 light:text-white light:hover:bg-zinc-700',
  outline:
    'border border-white/15 bg-white/[0.03] text-zinc-100 hover:border-white/30 hover:bg-white/[0.07] focus-visible:ring-white/30 light:border-black/15 light:bg-white light:text-zinc-800 light:hover:border-black/30 light:hover:bg-zinc-100',
  ghost: 'text-zinc-300 hover:bg-white/[0.07] hover:text-white focus-visible:ring-white/25 light:text-zinc-600 light:hover:bg-black/5 light:hover:text-zinc-900',
  success: 'bg-neon-green/15 text-neon-green border border-neon-green/40 hover:bg-neon-green/25 light:text-[#00875A] light:border-[#00875A]/40',
  danger: 'bg-kamelia/15 text-kamelia border border-kamelia/40 hover:bg-kamelia/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
  icon: 'h-9 w-9 p-0',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <motion.button
      whileHover={props.disabled ? undefined : { scale: 1.02 }}
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
