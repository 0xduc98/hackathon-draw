import { motion, AnimatePresence } from 'framer-motion';

interface CountdownAnimationProps {
  count: number;
}

export const CountdownAnimation = ({ count }: CountdownAnimationProps) => {
  return (
    <AnimatePresence>
      {count <= 4 && count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white text-[200px] font-bold"
          >
            {count}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 