import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@repo/catalog";
import { getPost, getPosts } from "@/lib/posts";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/research/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description, openGraph: { type: "article", publishedTime: post.date } };
}

export default async function PostPage(props: PageProps<"/research/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="wrap pb-10 pt-28">
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-faint">
        <Link href="/research" className="hover:text-fg">
          Research
        </Link>{" "}
        / {post.date}
      </nav>
      <header className="mx-auto mt-12 max-w-3xl">
        <ul className="flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <li key={t} className="chip h-6 text-[11px]">
              {t}
            </li>
          ))}
        </ul>
        <h1 className="mt-6 text-[clamp(38px,5.4vw,72px)] font-semibold leading-[0.98] tracking-[-0.05em]">{post.title}</h1>
        <p className="mt-6 text-xl leading-relaxed text-dim">{post.description}</p>
        <p className="mt-8 border-y border-line py-4 font-mono text-xs text-faint">
          {brand.founder.name} · {post.date} · {post.minutes} min read
        </p>
      </header>
      <div className="prose-nova mx-auto mt-10 max-w-3xl" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
