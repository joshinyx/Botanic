import QRCode from "qrcode";

export async function generateQRDataURL(plantId: string, baseUrl: string): Promise<string> {
  const url = `${baseUrl}/plants/${plantId}`;
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#f7f8f8",
      light: "#08090a",
    },
  });
}

export async function generateQRSVG(plantId: string, baseUrl: string): Promise<string> {
  const url = `${baseUrl}/plants/${plantId}`;
  return QRCode.toString(url, {
    type: "svg",
    width: 300,
    margin: 2,
    color: {
      dark: "#f7f8f8",
      light: "#08090a",
    },
  });
}
