export default function FileIcon({ fileName, size = 28 }) {
  if (!fileName) return null;

  const ext = fileName.toLowerCase().split('.').pop();
  
  // Tentukan tipe file
  let type = 'file';
  let label = 'FILE';
  let bgColor = '#6b7280'; // default gray
  let textColor = 'white';

  if (['pdf'].includes(ext)) {
    type = 'pdf';
    label = 'PDF';
    bgColor = '#ef4444'; // merah
    textColor = 'white';
  } else if (['doc', 'docx'].includes(ext)) {
    type = 'word';
    label = 'WORD';
    bgColor = '#3b82f6'; // biru
    textColor = 'white';
  } else if (['xls', 'xlsx'].includes(ext)) {
    type = 'excel';
    label = 'EXCEL';
    bgColor = '#22c55e'; // hijau
    textColor = 'white';
  } else if (['ppt', 'pptx'].includes(ext)) {
    type = 'ppt';
    label = 'PPT';
    bgColor = '#f59e0b'; // orange
    textColor = 'white';
  } else if (['zip', 'rar', '7z'].includes(ext)) {
    type = 'zip';
    label = 'ZIP';
    bgColor = '#8b5cf6'; // ungu
    textColor = 'white';
  } else if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) {
    type = 'audio';
    label = 'AUDIO';
    bgColor = '#ec4899'; // pink
    textColor = 'white';
  } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    type = 'video';
    label = 'VIDEO';
    bgColor = '#6366f1'; // indigo
    textColor = 'white';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    // Gambar akan ditangani oleh thumbnail, bukan ikon
    return null;
  }

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);

  // Jika gambar, return null agar thumbnail yang digunakan
  if (isImage) return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: Math.max(8, size * 0.35),
        fontWeight: 700,
        color: textColor,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    >
      {label}
    </div>
  );
}
