export const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;

  // Replace backslashes with forward slashes for Windows paths
  const normalizedUrl = url.replace(/\\/g, '/');
  
  // Ensure we don't double the leading slash
  const path = normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
  
  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace("/api", "") 
    : "http://localhost:5000";
    
  return `${baseUrl}${path}`;
};

export const getAvatarUrl = (url, name) => {
  if (url) return getImageUrl(url);
  const safeName = name || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff&size=150`;
};
