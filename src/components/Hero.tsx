import Image from "next/image";
import ThemeToggle from "./ThemeToggle"; // Import the toggle

export default function Hero() {
  return (
    // Added dark:bg-slate-900
    <section className="relative overflow-hidden bg-white dark:bg-slate-900 pb-12 pt-16 sm:pb-16 sm:pt-24 lg:pb-32 lg:pt-40 transition-colors duration-300">
      
      {/* Add the Toggle Button somewhere visible, e.g., top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-16 lg:items-center">
          
          <div className="text-center lg:text-left">
            {/* Added dark:text-white */}
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Build your next idea 
              {/* Added dark:text-blue-400 for better contrast */}
              <span className="text-blue-600 dark:text-blue-400 block">faster than ever.</span>
            </h1>
            
            {/* Added dark:text-slate-400 */}
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Focus on your business logic and let us handle the infrastructure. 
              Scale seamlessly from your first user to your first million.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <a
                href="#"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get Started
              </a>
              {/* Added dark:text-white */}
              <a href="#" className="text-sm font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-1">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Added dark:bg-slate-800/50 for the image container background */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl bg-slate-100 dark:bg-slate-800/50">
              <Image
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
                alt="App screenshot"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
