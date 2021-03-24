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
const io=socketio(httpServer,{cors:{origin:"*"},transports:['websocket','polling','flashsocket']});

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
    socket.on('getTradeups',async (data)=>{
        let breaker=false;
        console.log('received request',data);
        const numberCollections=68;
        for(let collection_id=1;collection_id<numberCollections;++collection_id)
        {
            console.log('checking for id ',collection_id);
            if(collection_id===54)
                continue;
            if(breaker)
                break;
            const statTrak=data.statTrak;
            const budget=data.budget;
            const minProfit=data.minProfit;
            let res_obj=await calculateTradeup(collection_id,data.statTrak,data.budget,data.minProfit);
            socket.emit('getCollectionTradeups',res_obj);
            //     const worker = new Worker(`${__dirname}/worker.js`,{workerData:{collection_id,statTrak,budget,minProfit}});
            // //received output from worker
            // worker.once('message',(msg)=>{
            //     if(msg)
            //     {
            //         console.log(`Sending ${msg.collection}`)
            //         socket.emit('getCollectionTradeups',msg);
            //     }
            // })
        }
        socket.on('disconnect',()=>{
                breaker=true;
                console.log(`User ${socket.id} disconnected`);
            }) 
    })
})
    

httpServer.listen(process.env.PORT||5000);