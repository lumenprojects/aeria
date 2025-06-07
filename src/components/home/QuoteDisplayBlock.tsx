import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const quotes = [
  "Кто-то забыл хлеб в печи, и он снова получился как у бабки Реви.",
  "Петух сегодня не кричал. Все вышли позже обычного.",
  "Где нож с костяной ручкой? Он сам возвращается, когда надо.",
  "Мы ждали гостей. Пришёл ветер.",
  "Он сказал: 'я быстро', и пропал на два года. Вернулся с пирогом.",
  "Печь сегодня кашлянула. Кто-то всё-таки помнит бабку.",
  "Сегодня кошка села на книгу и мы поняли, что это конец главы.",
  "Зеркало запотело снаружи. Всё-таки зима.",
  "На чердаке пахнет лавандой. Никто не поднимался туда с осени.",
  "Овца украла карту. Спорить с ней никто не стал."
]

export default function QuoteDisplayBlock() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  const generateQuote = () => {
    setVisible(false)
    setTimeout(() => {
      const next = Math.floor(Math.random() * quotes.length)
      setIndex(next)
      setVisible(true)
    }, 300)
  }

  return (
    <div className="bg-neutral-100 text-neutral-700 font-serif shadow-lg rounded-2xl p-6 w-full max-w-2xl mx-auto border border-neutral-300">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="italic text-lg leading-relaxed"
          >
            “{quotes[index]}”
          </motion.p>
        )}
      </AnimatePresence>
      <div className="text-right mt-4">
        <button
          onClick={generateQuote}
          className="text-sm text-blue-600 hover:underline transition-all"
        >
          Слушать дальше →
        </button>
      </div>
    </div>
  )
}
