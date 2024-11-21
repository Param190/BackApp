const express = require('express');
const app = express();
const port = 3000;

const event = require('./routes/event');

app.use(express.json());
app.use('/api/v3/app',event);

app.listen(port,()=>{
    console.log(`Server running on ${port}`);
});