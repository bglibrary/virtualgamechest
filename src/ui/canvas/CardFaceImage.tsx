import { Image } from "react-konva";
import useCardImage from "@/ui/hooks/useCardImage";
import computeCoverCrop from "@/ui/canvas/coverCrop";

interface CardFaceImageProps {
  imageUrl: string;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fallback: React.ReactNode;
}

function CardFaceImage({
  imageUrl,
  cardWidth,
  cardHeight,
  cornerRadius,
  fallback,
}: CardFaceImageProps) {
  const { image, loading, error } = useCardImage(imageUrl);

  if (!image || loading || error) {
    return <>{fallback}</>;
  }

  const crop = computeCoverCrop(
    image.naturalWidth,
    image.naturalHeight,
    cardWidth,
    cardHeight,
  );

  return (
    <Image
      image={image}
      x={0}
      y={0}
      width={cardWidth}
      height={cardHeight}
      cropX={crop.cropX}
      cropY={crop.cropY}
      cropWidth={crop.cropWidth}
      cropHeight={crop.cropHeight}
      cornerRadius={cornerRadius}
    />
  );
}

export default CardFaceImage;
