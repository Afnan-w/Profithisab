export function JsonLd({ objects, id }: { objects: unknown[]; id?: string }) {
  return (
    <>
      {objects.map((obj, i) => (
        <script
          key={id ? `${id}-${i}` : i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
