const express = require('express');
const router = express.Router();

const {client,connectDB} = require('../db');

const upload = require('../middleware/upload');
const {ObjectId, ReturnDocument} = require('mongodb');

router.get('/events',async(req,res)=>{
    const {uid:event_id} = req.query;
    if(!event_id){
        return res.status(400).json({
            message:'Id is required'
        });
    }
    const numericEventID = parseInt(event_id,10) 
    try{
        const {db} = await connectDB();
        const result = await db.collection('events').findOne({uid : numericEventID});
        if(!result){
            return res.status(404).json({
                message:'Id not found'
            })
        }
        res.status(200).json(result);
    }catch(err){
        console.log(err.message);
    }
});

router.get('/events1', async (req, res) => {
    const { type = 'latest', limit = 10, page = 1 } = req.query;

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);

    if (isNaN(limitNum) || isNaN(pageNum) || limitNum <= 0 || pageNum <= 0) {
        return res.status(400).json({ message: 'Invalid limit or page number' });
    }

    try {
        const { db } = await connectDB();

        const sortCriteria = type === 'latest' ? { createdAt: -1 } : {};

        const skip = (pageNum - 1) * limitNum;

        const events = await db
            .collection('events')
            .find({})
            .sort(sortCriteria) 
            .skip(skip) 
            .limit(limitNum) 
            .toArray();

        res.status(200).json({
            currentPage: pageNum,
            limit: limitNum,
            totalEvents: events.length,
            events,
        });
    } catch (err) {
        console.error('Error fetching events:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/events', upload.single('files[image]'), async (req, res) => {
    const { name, tagline, schedule, description, moderator, category, sub_category, rigor_rank } = req.body;
    if (!req.file || !name || !tagline || !schedule || !description || !moderator || !category || !sub_category || !rigor_rank) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const{gfsBucket, db} = await connectDB();
        const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype
        });
        uploadStream.end(req.file.buffer);

        uploadStream.on('finish', async () => {

            const event = {
                name,
                tagline,
                schedule: new Date(schedule), 
                description,
                moderator,
                category,
                sub_category,
                rigor_rank: parseInt(rigor_rank, 10), 
                imageFileId: uploadStream.id 
            };

            const result = await db.collection('events').insertOne(event);
            res.status(201).json({
                message: 'Event uploaded successfully',
                eventId: result.insertedId,
                fileId: uploadStream.id
            });
        });
        uploadStream.on('error', (err) => {
            console.error('File Upload Error:', err);
            res.status(500).json({ message: 'Error uploading file', error: err.message });
        });
    }catch(err){
        console.error('Error:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }

})

router.put('/eventsPut/:id',async (req,res)=>{
    const {id} = req.params;
    const updatedData = req.body;
    if(!ObjectId.isValid(id)){
        return res.status(400).json({
            message:'Id is required'
        });
    }
    //const numericEventID = parseInt(event_id,10) ;
    try{
        const {db} = await connectDB();

        const result = await db.collection('events').findOneAndUpdate(
            {_id:new ObjectId(id)},
            {$set: updatedData},
            {returnDocument: 'after'}
        );
        res.status(200).json({
            message: 'Event updated successfully',
            updatedEvent: result.value,
        });
    }catch(err){
        console.error('Error updating event:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }

});

router.delete('/eventsDel/:id',async (req,res)=>{
    const {id} = req.params;
    console.log(id);
    if(!ObjectId.isValid(id)){
        return res.status(400).json({
            message:'Id is required'
        });
    }
    //const numericEventID = parseInt(uid,10) ;
    try{
        const {db} = await connectDB();

        const result = await db.collection('events').deleteOne({_id:new ObjectId(id)});
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Document not found',
            });
        }
        
        res.status(200).json({
            message: 'Event deleted successfully',
        });
    }catch(err){
        console.error('Error updating event:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }

});



module.exports = router;