const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');
const request=require('request-promise');
const cheerio=require('cheerio');
const http=require('http');
const socketio=require('socket.io');
const calculateTradeup=require('./worker');

const app=express();
const httpServer=http.createServer(app);
const io=socketio(httpServer,{cors:{origin:"*",credentials: true},transports:['websocket','polling','flashsocket']});

app.use(cors({origin:'*'}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));


// 1) Get Request with {statTrak,budget,minProfit} from frontend.
// 2) Loop through collection_id's by creating a worker thread for each collection.
// 3) Inside Each Worker do computation required.
// 4) Send Message From Worker to main and store in result_obj.
// 5) Send Result obj to frontend.

io.on('connect',(socket)=>{
    console.log(`user ${socket.id} connected`);
    socket.isRunning=false;
    socket.stopLoop=false;
    socket.on('disconnect',()=>{
            socket.stopLoop=true;
            console.log(`User ${socket.id} disconnected`);
        })
    socket.on('getRunningStatus',(callback)=>{
        callback({
            isRunning:socket.isRunning,
        });
    })
    socket.on('stopLoop',()=>{
        socket.stopLoop=true;
    })
    socket.on('getTradeups',async (data)=>{
        console.log('received request',data);
        const numberCollections=68;
        socket.isRunning=true;
        for(let collection_id=1;collection_id<numberCollections;++collection_id)
        {
            console.log('checking for id ',collection_id,' User ',socket.id);
            if(collection_id===54)
                continue;
            if(socket.stopLoop)
            {
                socket.stopLoop=false;
                socket.isRunning=false;
                console.log('Loop Stopped for ',socket.id);
                break;
            }
            const statTrak=data.statTrak;
            const budget=data.budget;
            const minProfit=data.minProfit;
            const res=await calculateTradeup(collection_id,data.statTrak,data.budget,data.minProfit);
            socket.emit('getCollectionTradeups',res);
        }
        console.log('completed processing for ',socket.id);
    })
})
    

httpServer.listen(process.env.PORT||5000);