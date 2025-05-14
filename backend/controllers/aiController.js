const axios = require('axios');

exports.recommendAdvancedFeatures = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY2;
    const prompt = `You are an expert AI product analyst. Based on the following project description, list 5 advanced AI-powered or tech-enhanced features that could be integrated into the project. Be specific and practical.\n\nProject Description:\n${description}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response?.data?.choices?.[0]?.message?.content;
    const suggestions = text
      ? text.split(/\n|\d+\.\s/).filter(item => item.trim().length > 8)
      : [];

    res.json({ suggestions });
  } catch (err) {
    console.error('OpenRouter AI error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI generation failed.' });
  }
};
