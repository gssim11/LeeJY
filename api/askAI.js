// Vercel에서 실행될 비밀 요원의 코드입니다. (파일명: askAI.js)

// 이 함수가 우리의 웹페이지 요청을 처리합니다.
export default async function handler(request, response) {
    // 웹페이지에서 보낸 요청이 POST 방식이 아니면 거절합니다.
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'POST 요청만 허용됩니다.' });
    }

    try {
        // 웹페이지에서 보낸 성장 기록 텍스트를 꺼냅니다.
        // request.body가 없거나 journalText가 없으면 오류를 반환합니다.
        if (!request.body || !request.body.journalText) {
             return response.status(400).json({ message: '성장 기록 내용이 없습니다.' });
        }
        const { journalText } = request.body;
        
        // Vercel의 비밀 서랍(환경 변수)에서 API 키를 가져옵니다.
        // 이 키는 GitHub에는 절대 올라가지 않아요!
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // 서버 관리자만 볼 수 있는 로그입니다.
            console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
            // 사용자에게는 간단한 오류 메시지를 보냅니다.
            return response.status(500).json({ message: '서버 설정에 문제가 있습니다.' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        // Gemini AI에게 보낼 요청 내용을 여기서 설정합니다.
        const systemPrompt = "You are a warm and encouraging pediatric physical therapy expert providing advice to a parent. Your response must be in Korean. Structure your response into two parts using markdown: 1. Start with '### 📈 성장 요약 및 격려 메시지'. Provide a short, positive summary of the child's progress and an encouraging message for the parent. 2. Then, add '### 🤸‍♀️ 새로운 맞춤 놀이 제안'. Based on the parent's notes, suggest 2 new and creative play activities. For each activity, provide a name in bold, a simple description of how to do it, and what it helps with. Format the activities as a numbered list. Be creative and different from common suggestions.";
        const userPrompt = `Here is my observation about my 13-month-old child, Jaeyoon's, walking progress: "${journalText}". Please provide a summary, encouragement, and 2 new play ideas based on these notes.`;
        
        const payload = {
            contents: [{
                parts: [{ text: userPrompt }]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                temperature: 0.7,
                topP: 1.0,
                maxOutputTokens: 2048,
            }
        };

        // fetch를 사용해 Gemini AI와 통신합니다.
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Gemini API 오류:", errorBody);
            throw new Error(`Gemini API 요청 실패: ${geminiResponse.status}`);
        }

        const result = await geminiResponse.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            // 성공적인 응답을 웹페이지로 다시 보내줍니다.
            response.status(200).json({ text: candidate.content.parts[0].text });
        } else {
             // Gemini가 응답을 생성하지 못한 경우 (안전 필터 등)
            console.error("Gemini 응답에 내용이 없음:", JSON.stringify(result, null, 2));
            const blockReason = result.promptFeedback?.blockReason || '알 수 없는 이유';
            response.status(500).json({ message: `AI가 응답을 생성하지 못했습니다. (사유: ${blockReason})` });
        }

    } catch (error) {
        console.error('비밀 요원(askAI) 오류:', error);
        // 일반적인 오류 메시지를 웹페이지로 보냅니다.
        response.status(500).json({ message: '요청을 처리하는 중 서버에서 오류가 발생했습니다.' });
    }
}

