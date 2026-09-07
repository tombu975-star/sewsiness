import { notFound } from "next/navigation";
import { fetchProduct } from "@/lib/storefront/demo-data";
import { CustomizeClient } from "@/components/storefront/CustomizeClient";

export default async function CustomizePage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  if (!product) notFound();
  return <CustomizeClient product={product} />;
}
