type IconMarkProps = {
  size: number;
  radius?: number;
};

export function IconMark({ size, radius = Math.round(size * 0.22) }: IconMarkProps) {
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#003CFF",
        color: "#ffffff",
        borderRadius: radius,
        fontSize,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      JC
    </div>
  );
}
