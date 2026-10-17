const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const DATA_FILE = path.join(__dirname, 'quotes.json');

const loadQuotes = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading file: ', err);
        return [];
    }
};

const saveQuotes = (quotes) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(quotes, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving file: ', err);
    }
};

const validateQuote = (req, res, next) => {
    const { author, text } = req.body;
    if (typeof author !== 'string' || author.trim().length === 0 || author.length > 200) {
        return res.status(400).json({ error: 'Author must be a string and cannot be over 200 characters.' });
    }
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 1000) {
        return res.status(400).json({ error: 'Text must be a string and cannot be over 1000 characters.' });
    }
    req.body.author = author.trim();
    req.body.text = text.trim();
    next();
};

router.post('/', validateQuote, (req, res) => {
    const { author, text } = req.body;
    const quotes = loadQuotes();
    const newQuote = {
        id: uuidv4(),
        author,
        text
    };
    quotes.push(newQuote);
    saveQuotes(quotes);
    res.status(201).json({ id: newQuote.id });
});

router.get('/', (req, res) => {
    const { author, page = 1, limit = 10 } = req.query;
    let quotes = loadQuotes();
    if (author) {
        quotes = quotes.filter(q => q.author.toLowerCase() === author.toLowerCase());
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedQuotes = quotes.slice(startIndex, endIndex);
    res.json({
        page: pageNum,
        limit: limitNum,
        total: quotes.length,
        data: paginatedQuotes
    });
});

router.get('/:id', (req, res) => {
    const quotes = loadQuotes();
    const quote = quotes.find(q => q.id === req.params.id);
    if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
    }
    res.json(quote);
});

router.put('/:id', validateQuote, (req, res) => {
    const { author, text } = req.body;
    const quotes = loadQuotes();
    const quoteIndex = quotes.findIndex(q => q.id === req.params.id);
    if (quoteIndex === -1) {
        return res.status(404).json({ error: 'Quote not found' });
    }
    quotes[quoteIndex] = {...quotes[quoteIndex], author, text};
    saveQuotes(quotes);
    res.json(quotes[quoteIndex]);
});

router.delete('/:id', (req, res) => {
    const quotes = loadQuotes();
    const filteredQuotes = quotes.filter(q => q.id !== req.params.id);
    if (quotes.length === filteredQuotes.length) {
        return res.status(404).json({ error: 'Quote not found' });
    }
    saveQuotes(filteredQuotes);
    res.status(204).send();
});

module.exports = router;