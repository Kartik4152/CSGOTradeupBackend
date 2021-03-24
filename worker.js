const request=require('request-promise');
const cheerio=require('cheerio');
const floats={
    'fn':0.07,
    'mw':0.15,
    'ft':0.38,
    'ww':0.45,
    'bs':1
}
const floats_lower={
    'fn':0,
    'mw':0.07,
    'ft':0.15,
    'ww':0.38,
    'bs':0.45
}
const wear_array=['fn','mw','ft','ww','bs'];

const skin={
    name:'',
    quality:0,
    maxwear:1,
    minwear:0,
    price:{
        fn:0,
        mw:0,
        ft:0,
        ww:0,
        bs:0
    },
    req:{
        fn:0,
        mw:0,
        ft:0,
        ww:0,
        bs:0
    },
    imgUrl:''
}


const f=async(cid,st,bd,mp)=>{
    let workerData={collection_id:cid,statTrak:st,budget:bd,minProfit:mp};
    let $=cheerio.load(await request(`http://csgo.exchange/collection/view/${workerData.collection_id}`))
    const title=$('h1').text();
    let result_obj={
        collection:title,
        tradeups:[]
    }
   if(workerData.statTrak&&$('label[for="chkCollST"]').length==0){
    return result_obj;
   }
    $=cheerio.load(await request(`http://csgo.exchange/collection/view/${workerData.collection_id}/show/${Number(workerData.statTrak)+1}/0`))
    let re=/background-image:url\((.*)\)/
    let skins=[];
    let prices=[];
    if(workerData.statTrak)
       $('div.vItem.StatTrak').each((index,element)=>{
           if($(element).attr('data-name')!='M4A4 | Howl'){
           skins.push($(element).attr());
           try{
               prices.push(Number($(element).find('.priceItem').text()));
           }
           catch{
               prices.push(-1);
           }
           try{
               skins[skins.length-1].imgUrl=(($(element).find('.imgItem').attr('style')).match(re)[1]);
           }
           catch{
               skins[skins.length-1].imgUrl='default';
           }
        }});
    else
       $('div.vItem.Normal').each((index,element)=>{
           if($(element).attr('data-name')!='M4A4 | Howl'){
           skins.push($(element).attr());
           try{
               prices.push(Number($(element).find('.priceItem').text()));
           }
           catch{
               prices.push(-1);
           }
           try{
               skins[skins.length-1].imgUrl=(($(element).find('.imgItem').attr('style')).match(re)[1]);
           }
           catch{
               skins[skins.length-1].imgUrl='default';
           }
        }});
    //get max quality (covert etc)
    const maxqual=skins[0]['data-quality'];
    //get leastqual (consumer grade etc)
    const leastqual=skins[skins.length-1]['data-quality'];
    
    let cur_qual=maxqual;
    let weapon_list=[];
    let temp_weapon_list=[];
    //as all skins are already sorted from covert to consumer, we iterate over them in order.
    for(let j=0;j<skins.length;++j)
    {
        //if current skin has same quality as cur_qual
        if(skins[j]['data-quality']==cur_qual){
            //create a deep copy of the skin template
            let wep=JSON.parse(JSON.stringify(skin));
            //add stuff to wep
            wep.name=skins[j]['data-name'];
            wep.quality=skins[j]['data-quality'];
            wep.maxwear=skins[j]['data-maxwear'];
            wep.minwear=skins[j]['data-minwear'];
            //float=min+range*avg;
            wep.req.fn=(floats['fn']-wep.minwear)/(wep.maxwear-wep.minwear);
            wep.req.mw=(floats['mw']-wep.minwear)/(wep.maxwear-wep.minwear);
            wep.req.ft=(floats['ft']-wep.minwear)/(wep.maxwear-wep.minwear);
            wep.req.ww=(floats['ww']-wep.minwear)/(wep.maxwear-wep.minwear);
            wep.req.bs=(floats['bs']-wep.minwear)/(wep.maxwear-wep.minwear);
            wep.price.fn=prices[j];
            wep.imgUrl=skins[j].imgUrl;
            //push wep to temp_list
            temp_weapon_list.push(JSON.parse(JSON.stringify(wep)));
        }
        //now our quality has reduced.
        else{
            //add all skins of cur_qual to weapon_list
            weapon_list.push(JSON.parse(JSON.stringify(temp_weapon_list)));
            temp_weapon_list=[];
            cur_qual=skins[j]['data-quality'];
            j--;
        }
    }
    //adding last temp_list of minqual weapons
    weapon_list.push(JSON.parse(JSON.stringify(temp_weapon_list)));
    
    //now do the same shit for all wears
    for(let wear=1;wear<5;++wear)
    {
        let imgUrlList=[];
        $=cheerio.load(await request(`http://csgo.exchange/collection/view/${workerData.collection_id}/show/${Number(workerData.statTrak)+1}/${wear}`))
        prices=[];
        if(workerData.statTrak)
        $('div.vItem.StatTrak').each((index,element)=>{
            if($(element).attr('data-name')!='M4A4 | Howl'){
            try{
                prices.push(Number($(element).find('.priceItem').text()));
            }
            catch{
                prices.push(-1);
            }
            try{
                imgUrlList.push(($(element).find('.imgItem').attr('style')).match(re)[1]);
            }
            catch{
               imgUrlList.push('default');
            }
        }});
        else
        $('div.vItem.Normal').each((index,element)=>{
            if($(element).attr('data-name')!='M4A4 | Howl'){
            try{
                prices.push(Number($(element).find('.priceItem').text()));
            }
            catch{
                prices.push(-1);
            }
            try{
                imgUrlList.push(($(element).find('.imgItem').attr('style')).match(re)[1]);
            }
            catch{
                imgUrlList.push('default');
            }
        }});
        cur_qual=maxqual;
        temp_weapon_list=[];
        // k is current index of prices and imgUrlList
        let k=0;
        //as all skins are already sorted from covert to consumer, we iterate over them in order.
        for(let i=0;i<weapon_list.length;++i)
        {
            for(let j=0;j<weapon_list[i].length;++j)
            {
                //add prices depending on wear
                switch(wear){
                    case 1:weapon_list[i][j].price.mw=prices[k++];
                        break;
                    case 2:weapon_list[i][j].price.ft=prices[k++];
                        break;
                    case 3:weapon_list[i][j].price.ww=prices[k++];
                        break;
                    case 4:weapon_list[i][j].price.bs=prices[k++];
                        break;
                }

                //update photo if photo was default
                if(weapon_list[i][j].imgUrl=='default')
                    weapon_list[i][j].imgUrl=imgUrlList[k-1];
            }
        }
    }
    //We've now got all the weapons loaded with their attributes.
    //selecting one quality level at a time
    for(let i=weapon_list.length-1;i>0;--i)
    {
        //selecting a skin in that quality level which we will use for tradeup
        for(let j=0;j<weapon_list[i].length;++j)
        {
           //we now select a wear for the selected skin
           for(const wear in weapon_list[i][j].price)
            {
                //if that wear does not exist then try different wear
                if(weapon_list[i][j].price[wear]<=0)
                    continue
                //when broke person sends request
                if(weapon_list[i][j].price[wear]*10>workerData.budget)
                    continue
                let minval=9999999;
                let maxval=-999999;
                let cost=weapon_list[i][j].price[wear]*10;
                let min_float=Math.max(floats_lower[wear],weapon_list[i][j].minwear);
                let possibilities={
                    tradeup_weapon:weapon_list[i][j],
                    tradeup_weapon_wear:wear,
                    cost:cost,
                    minProfit:0,
                    maxProfit:0,
                    float_required:1,
                    outcomes:[],
                };
                let reqfl=1;
                //else we iterate one tier up to check if skins can be produced profitably
                for(let k=0;k<weapon_list[i-1].length;++k)
                {
                    //weapon we are checking is weapon_list[i-1][k]
                    //we first check what wear will we get from min_float
                    for(wr of wear_array){
                        if(min_float<weapon_list[i-1][k].req[wr])
                        {
                            sell_price=weapon_list[i-1][k].price[wr];
                            profit=sell_price*0.87-cost;
                            possibilities.outcomes.push({
                                weapon:weapon_list[i-1][k],
                                wear:wr,
                                sell_price:sell_price,
                                profit:profit
                            })
                            reqfl=Math.min(reqfl,weapon_list[i-1][k].req[wr]);
                            break;
                        }
                    }
                }
                //find max and min profit values
                possibilities.outcomes.forEach(obj=>{
                    if(obj.profit<minval)
                        minval=obj.profit;
                    if(obj.profit>maxval)
                        maxval=obj.profit;
                })
                possibilities.float_required=reqfl;
                possibilities.minProfit=minval;
                possibilities.maxProfit=maxval;
                if(possibilities.minProfit>=workerData.minProfit)
                result_obj.tradeups.push(JSON.parse(JSON.stringify(possibilities)));
            }
        }
    }
    return result_obj;
}

module.exports=f;