interface SharedGenerationPageProps {
  params: {
    id: string;
  };
}

export default function SharedGenerationPage({
  params,
}: SharedGenerationPageProps) {
  return <main>Shared generation: {params.id}</main>;
}
