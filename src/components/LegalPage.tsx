import { Brand } from "@/components/Brand";
import { SiteFooter } from "@/components/SiteFooter";

export function LegalPage({
  title,
  effective,
  children,
}: {
  title: string;
  effective: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-zinc-100">
      <header className="max-w-3xl w-full mx-auto flex items-center px-6 h-16">
        <Brand />
      </header>

      <main className="max-w-3xl w-full mx-auto px-6 pt-10 pb-24 flex-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective {effective}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-zinc-300 [&_a]:text-violet-400 [&_a:hover]:text-violet-300 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-zinc-100">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}
