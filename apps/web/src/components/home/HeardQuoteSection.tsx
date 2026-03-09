import * as React from "react";
import type { HomeWorldQuoteDTO } from "@aeria/shared";
import { RevealText, Typography } from "@/components/ui";
import { getRandomHomeWorldQuote } from "@/lib/api";

type HeardQuoteSectionProps = {
  initialQuote: HomeWorldQuoteDTO;
};

export function HeardQuoteSection({ initialQuote }: HeardQuoteSectionProps) {
  const [quote, setQuote] = React.useState(initialQuote);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleNextQuote = React.useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      let nextQuote = await getRandomHomeWorldQuote(quote.id);

      // Extra guard: never show the same quote twice in a row.
      if (nextQuote?.id === quote.id) {
        nextQuote = await getRandomHomeWorldQuote(quote.id);
      }

      if (nextQuote && nextQuote.id !== quote.id) {
        setQuote(nextQuote);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, quote.id]);

  return (
    <section className="home-heard" aria-live="polite">
      <div className="home-heard-copy">
        <Typography variant="h1" fontRole="body" as="blockquote" className="home-heard-quote"><RevealText key={quote.id} text={`« ${quote.quote} »`} mode="words" /></Typography>

        <Typography variant="body" as="p" className="home-heard-source"><RevealText key={`${quote.id}-source`} text={`— ${quote.source} —`} mode="words" delay={0.24} /></Typography>
      </div>

      <button
        type="button"
        className="home-heard-button accent-underline"
        onClick={handleNextQuote}
        aria-label="Подслушать ещё"
        aria-busy={isLoading}
      >
        <Typography variant="body" as="span" className="home-heard-button-label">
          Подслушать ещё
        </Typography>
      </button>
    </section>
  );
}
