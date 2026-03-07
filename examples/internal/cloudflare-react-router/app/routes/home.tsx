import { Resource } from "sst-react-router-cloudflare/resource";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SST React Router on Cloudflare" },
    {
      name: "description",
      content: "A React Router v7 app deployed to Cloudflare Workers with SST.",
    },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  const objects = await Resource.MyBucket.list({ limit: 5 });

  return {
    message: Resource.MyMessage.value,
    objectCount: objects.objects.length,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Experimental component</p>
        <h1 className="title">React Router v7 on Cloudflare</h1>
        <p className="subtitle">
          This internal example exercises <code>sst.cloudflare.x.React</code>,
          an R2 binding, and a linked secret through the SST runtime.
        </p>

        <div className="grid">
          <article className="card">
            <p className="label">Platform</p>
            <p className="value">Cloudflare Workers</p>
          </article>
          <article className="card">
            <p className="label">Component</p>
            <p className="value">sst.cloudflare.x.React</p>
          </article>
          <article className="card">
            <p className="label">Secret</p>
            <p className="value">{loaderData.message}</p>
          </article>
          <article className="card">
            <p className="label">Bucket</p>
            <p className="value">{loaderData.objectCount} objects on first page</p>
          </article>
        </div>

        <p className="note">
          The adapter resource helper works in both dev and deployed workers, so
          the loader can use both <code>Resource.MyBucket</code> and{' '}
          <code>Resource.MyMessage</code>.
        </p>
      </section>
    </main>
  );
}
