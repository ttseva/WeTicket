type PageStubProps = {
  title: string;
  description: string;
  endpoints?: string[];
};

export function PageStub({ title, description, endpoints = [] }: PageStubProps): JSX.Element {
  return (
    <section className="card">
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {endpoints.length > 0 && (
        <>
          <h3>Связанные API эндпоинты</h3>
          <ul>
            {endpoints.map((endpoint) => (
              <li key={endpoint}>
                <code>{endpoint}</code>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
