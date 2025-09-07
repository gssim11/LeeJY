// Vercel에서 실행될 비밀 요원의 코드입니다.

// 이 함수가 우리의 웹페이지 요청을 처리합니다.
export default async function handler(request, response) {
  // 웹페이지에서 보낸 요청이 POST 방식이 아니면 거절합니다.
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'POST 요청만 허용됩니다.' });
  }

  try {
    // 웹페이지에서 보낸 성장 기록 텍스트를 꺼냅니다.
    const { journalText } = request.body;
    
    // Vercel의 비밀 서랍(환경 변수)에서 API 키를 가져옵니다.
    // 이 키는 GitHub에는 절대 올라가지 않아요!
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API 키가 설정되지 않았습니다.");
    }

    const apiUrl = `https://generativela...
[truncated]
