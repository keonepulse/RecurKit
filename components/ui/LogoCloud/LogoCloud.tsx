export default function LogoCloud() {
  return (
    <div>
      <p className="mt-24 text-xs uppercase text-zinc-400 text-center font-bold tracking-[0.3em]">
        Built with
      </p>
      <div className="grid grid-cols-1 place-items-center	my-12 space-y-4 sm:mt-8 sm:space-y-0 md:mx-auto md:max-w-2xl sm:grid sm:gap-6 sm:grid-cols-4">
        <div className="flex items-center justify-start h-12">
          <img
            src="/nextjs.svg"
            alt="Next.js Logo"
            className="h-6 sm:h-12 text-white"
          />
        </div>
        <div className="flex items-center justify-start h-12">
          <img
            src="/stripe.svg"
            alt="Stripe Logo"
            className="h-12 text-white"
          />
        </div>
        <div className="flex items-center justify-start h-12">
          <img
            src="/supabase.svg"
            alt="Supabase Logo"
            className="h-10 text-white"
          />
        </div>
        <div className="flex items-center justify-start h-12">
          <img
            src="/github.svg"
            alt="GitHub Logo"
            className="h-8 text-white"
          />
        </div>
      </div>
    </div>
  );
}
