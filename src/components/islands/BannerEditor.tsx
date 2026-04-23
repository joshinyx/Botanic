interface Props {
  initialBannerUrl: string | null;
}

export default function BannerEditor({ initialBannerUrl }: Props) {
  return (
    <div style={{
      position: "relative", width: "100%", overflow: "hidden",
      ...(initialBannerUrl
        ? { aspectRatio: "4/1", minHeight: 80, maxHeight: 320 }
        : { height: 80, background: "var(--color-bg-base)" }
      ),
    }}>
      {initialBannerUrl && (
        <img src={initialBannerUrl} alt="Banner"
             style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </div>
  );
}
