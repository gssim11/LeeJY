// Vercel에서 실행될 비밀 요원의 코드입니다. (파일명: askAI.js)

export default async function handler(request, response) {
    // 요청이 POST 방식인지 확인합니다.
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'POST 요청만 허용됩니다.' });
    }

    try {
        // 요청 본문에서 journalText를 추출하고, 없는 경우 오류를 반환합니다.
        if (!request.body || !request.body.journalText) {
             return response.status(400).json({ message: '성장 기록 내용이 없습니다.' });
        }
        const { journalText } = request.body;
        
        // Vercel 환경 변수에서 비밀 API 키를 가져옵니다.
        const apiKey = process.env.GEMINI_API_KEY;

        // API 키가 설정되지 않은 경우 서버 오류를 반환합니다.
        if (!apiKey) {
            console.error("GEMINI_API_KEY가 Vercel 환경 변수에 설정되지 않았습니다.");
            return response.status(500).json({ message: '서버 설정에 오류가 발생했습니다. 관리자에게 문의하세요.' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        // Gemini AI에게 보낼 시스템 및 사용자 프롬프트를 설정합니다.
        const systemPrompt = "You are a warm and encouraging pediatric physical therapy expert providing advice to a parent. Your response must be in Korean. Structure your response into two parts using markdown: 1. Start with '### 📈 성장 요약 및 격려 메시지'. Provide a short, positive summary of the child's progress and an encouraging message for the parent. 2. Then, add '### 🤸‍♀️ 새로운 맞춤 놀이 제안'. Based on the parent's notes, suggest 2 new and creative play activities. For each activity, provide a name in bold, a simple description of how to do it, and what it helps with. Format the activities as a numbered list. Be creative and different from common suggestions.";
        const userPrompt = `Here is my observation about my 13-month-old child, Jaeyoon's, walking progress: "${journalText}". Please provide a summary, encouragement, and 2 new play ideas based on these notes.`;
        
        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                temperature: 0.7,
                topP: 1.0,
                maxOutputTokens: 2048,
            }
        };

        // fetch를 사용하여 Gemini API와 통신합니다.
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error("Gemini API 오류:", result);
            throw new Error(result.error?.message || `Gemini API 요청 실패: ${geminiResponse.status}`);
        }

        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            // 성공적인 응답을 웹페이지로 다시 보내줍니다.
            return response.status(200).json({ text: candidate.content.parts[0].text });
        } else {
            // Gemini가 응답을 생성하지 못한 경우 (안전 필터 등)
            console.error("Gemini 응답에 내용이 없음:", result);
            const blockReason = result.promptFeedback?.blockReason || '알 수 없는 이유';
            return response.status(500).json({ message: `AI가 응답을 생성하지 못했습니다. (사유: ${blockReason})` });
        }

    } catch (error) {
        console.error('비밀 요원(askAI) 오류:', error.message);
        // 일반적인 오류 메시지를 웹페이지로 보냅니다.
        return response.status(500).json({ message: '요청을 처리하는 중 서버에서 오류가 발생했습니다.' });
    }
}

