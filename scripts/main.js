window.formstate=true;
//NOTE: once confirmquestion is pressed, teams can press their buzzers (even if main timer hasn't started yet)
//take note of temporary parts used to test out certain features (find: TEMP)
var button1, button2, button3, button4, button5;
var led1, led2, led3, led4, led5;
var buttonpins = [2,3,4,5,6];
var ledpins = [8,10,12,11,9];

var time_limit = 10;	//10 seconds given to teams to press the buzzer once quizmaster finishes reading the question
var anstimelimit = 10; //10 seconds given to teams to answer the question once buzzer is pressed
var stealtimelimit = 5; //5 seconds given to steal upon pressing of the button
var teamnames = new Array();
var numteams = 5;
var scores = [0,0,0,0,0];

var points=[100,200,300,400,500];
var categories=['Internal Medicine','Surgery','Pediatrics','Obstetrics & Gynecology','Pharmacology'];

var curr_led;
var can_led = 1; //0 = cannot open LED; 1 = can open LED
var blocked = [false,false,false,false,false]; //all teams can press buzzer initially
var go = false; //indicator if teams can press buzzer or not
var stealstate = 0; //can only be up to two steals
var end_round = false; //indicator for when the round ends; set to true once all questions have been asked

var ansVar;
var tempans;
var stealVar;
var tempstealtime;

var index_currteam;
var points_curr; //points of currently chosen question
var deduc_curr;
var done = true; //to tell if a question is already done
var currently_bidding = false;

var ques_done = new Array(); //array containing states of questions (whether or not they're already called)
var pt_index_curr;
var categ_index_curr;
var isqueschosen=false;

var top = new Array();
var tie_breaker = false; //will become true if round for tie breaker; here to be able to reuse onPress()
var currently_bidding_clinch = false; //for clincher bidding
var teamnames_beforeRank = new Array(); //teamnames before rearranging
var scores_beforeRank = new Array(); //teamnames before rearranging
var clinch_state = false;

$(document).ready(function(){

     $('#questions').hide();
     $('#timer').hide();
     $('#timerbutton').hide();
     $('#bidbutton').hide();
     $('#test').show();
     $('#confirmques').hide();
     $('#buzzedteam').hide();
     $('#judgeans').hide();
     $('#stealbutton').hide();
     $('#ranker').hide();

     $('#times').hide();
     $('#team_display').hide();
     $('#all_scoreboard').hide();
     $('#question_board').hide();
     $('#chooser').hide();
     $('#buttons').hide();

     $('#judgeans_clincher').hide();
     

     // Declare these variables so you don't have to type the full namespace
     var IOBoard = BO.IOBoard;
     var IOBoardEvent = BO.IOBoardEvent;
     var LED = BO.io.LED;
     var Button = BO.io.Button;
     var ButtonEvent = BO.io.ButtonEvent;

     // Set to true to print debug messages to console
     BO.enableDebugging = true; 
          
     var host = window.location.hostname;
     if (window.location.protocol.indexOf("file:") === 0) {
          host = "localhost";
     }

     // attach fastclick to avoid 300ms click delay on mobile devices
     FastClick.attach(document.body);

     var arduino = new IOBoard(host, 8887);
     
     arduino.addEventListener(IOBoardEvent.READY, onReady);	//waits for arduino board to get ready

     function onReady(event) {
          arduino.removeEventListener(IOBoardEvent.READY, onReady); 	//removes event listener for arduino board (only have to do it once)

          //the following determines what would happen in certain events
               //like if a button is pressed, etc.

          //initializes buttons for input
          button1 = new Button(arduino, arduino.getDigitalPin(buttonpins[0]));
          button2 = new Button(arduino, arduino.getDigitalPin(buttonpins[1]));
          button3 = new Button(arduino, arduino.getDigitalPin(buttonpins[2]));
          button4 = new Button(arduino, arduino.getDigitalPin(buttonpins[3]));
          button5 = new Button(arduino, arduino.getDigitalPin(buttonpins[4]));

          //initializes buttons for input
          led1 = new LED(arduino, arduino.getDigitalPin(ledpins[0]));
          led2 = new LED(arduino, arduino.getDigitalPin(ledpins[1]));
          led3 = new LED(arduino, arduino.getDigitalPin(ledpins[2]));
          led4 = new LED(arduino, arduino.getDigitalPin(ledpins[3]));
          led5 = new LED(arduino, arduino.getDigitalPin(ledpins[4]));

          button1.addEventListener(ButtonEvent.PRESS, onPress);
          button2.addEventListener(ButtonEvent.PRESS, onPress);
          button3.addEventListener(ButtonEvent.PRESS, onPress);
          button4.addEventListener(ButtonEvent.PRESS, onPress);
          button5.addEventListener(ButtonEvent.PRESS, onPress);
          
     }
     
     $('#submitbutton').on('click',editScores);
     $("#dialog").on('submit',function(){return false;});
});

// function turnoff_leds(){
//      for(var i = 0; i < ledpins.length; i++){
//           var led = 'led' + (i + 1);
//           window[led].off();
//      }
// }

function editScores(){ //note: the '+' converts string text into a number (can only enter a number in the text box)
     scores[0] = +(document.forms["editscores"]["a_2"].value);
     scores[1] = +(document.forms["editscores"]["b_2"].value);
     scores[2] = +(document.forms["editscores"]["c_2"].value);
     scores[3] = +(document.forms["editscores"]["d_2"].value);
     scores[4] = +(document.forms["editscores"]["e_2"].value);
     scoreboard();
     for (var i = 0; i < points.length; i++)
          for (var j = 0; j < categories.length; j++) {
               ques_done[i][j] = ($('#check' + i + j).is(":checked") ? 0 : 1);
          }
     updateChosen();
     $( "#dialog" ).dialog( "close" );
     document.forms["editscores"].reset();
}

function keyfunction(e) {
     var evtobj=window.event? event : e; //distinguish between IE's explicit event object (window.event) and Firefox's implicit.
     var unicode=evtobj.charCode? evtobj.charCode : evtobj.keyCode;
     var actualkey=String.fromCharCode(unicode);//*/
     //var evtobj=window.event? event : e; //evtobj.ctrlKey
     if(actualkey=' ' && !($("#dialog").dialog( "isOpen"))) {
          $( "#dialog" ).dialog( "open" );
          document.forms["editscores"].reset();
          $('#a_1').html(teamnames[0]); $('#b_1').html(teamnames[1]);
          $('#c_1').html(teamnames[2]); $('#d_1').html(teamnames[3]); $('#e_1').html(teamnames[4]);
          document.forms["editscores"]["a_2"].defaultValue=scores[0];
          document.forms["editscores"]["b_2"].defaultValue=scores[1];
          document.forms["editscores"]["c_2"].defaultValue=scores[2];
          document.forms["editscores"]["d_2"].defaultValue=scores[3];
          document.forms["editscores"]["e_2"].defaultValue=scores[4];
          generateQuestionEdit();
          return false;
     }
}
function generateQuestionEdit() {
     var text = "<p style='text-align:center;'>Questions Visible:</h4>";
     text += "<table style='margin-left:auto; margin-right:auto;'>\n";
     for (var i = 0; i < points.length; i++) {
          text += "<tr>";
          for (var j = 0; j < categories.length; j++) {
               text += "<td>";
               text += "<input type='checkbox' id='check" + i + j + "' " + (!ques_done[i][j] ? "checked='checked'": "") + ">";
               text += "</td>\n";
          }
          text += "</tr>\n";
     }
     $('#checkboxdiv').html(text);
}

var audio1 = document.getElementById("ansbuzz"); //id of audio imported in bottom section of this code
function onPress(evt){
     var btn = evt.target;
     var index = (buttonpins.indexOf(btn.pinNumber));
     if(go && (!blocked[index])) {
          if(can_led){
               curr_led = 'led' + (index + 1);
               window[curr_led].on(1);
          }
          $('#timerbutton').hide();
          audio1.play();
          if(!tie_breaker){
               $('#buzzedteam').html(teamnames[index]); 	
          }
          else{
               $('#buzzedteam').html(teamnames_beforeRank[index]);	//button indices are dependent on original team name arrangements (prior to ranking)
          }

          $('#buzzedteam').bigText();
          $('#stealtimedisp').html(""); 
          index_currteam = index;
          blocked[index] = true; //would prevent current team from pressing their buzzer in the future for current question
          go = false; //prevents other teams from pressing their buzzer
          //$('#judgeans').show();

          if(!tie_breaker){ //different way of judging for tie breaking round
               $('#judgeans').show();
          }
          else{
               $('#judgeans_clincher').show(); //no need for judging in tie-breaker; just need way of determining which team buzzed
          }

          if(pt_index_curr == 5){ //change width if not bidding
               $('#bidvalue').show();
               document.getElementById("correctinput").style.width='33%';
               document.getElementById("incorrectinput").style.width='33%';
          }
          else{
               $('#bidvalue').hide();
               document.getElementById("correctinput").style.width='50%';
               document.getElementById("incorrectinput").style.width='50%';
               
          }//*/
          clearInterval(timeVar); //stop timer
          clearInterval(stealVar); //stop steal timer
          
          if(clinch_state){
               $('#clear_clinch').show();
          }

          $('#timer').html(""); //remove timer
          //start timer for answering of the team
          tempans = anstimelimit; //tempans is variable for answering countdown that will be displayed; initially set to time limit in answering
          $('#anstimer').html("<div class='noans normal_2' style='line-height:10px;'>You have <br/><span class='timer2'>" + tempans + " </span></br>seconds to answer.</div>"); $("#anstimer").bigText();
          tempans--;
          ansVar=setInterval(function(){answerTimer()},1000); //goes to function answerTimer every 1s; ansVar is variable for time for answering

     }
}

var audio3 = document.getElementById("turnup");
var audiotick = document.getElementById("tick");
function answerTimer(){
     can_led = 0;
     if(tempans > 1){
          $('#anstimer').html("<div class='noans normal_2' style='line-height:10px;'>You have <br/><span class='timer2'>" + tempans + " </span><br/>seconds to answer.</div>");$("#anstimer").bigText();
          audiotick.play();
     }
     else if(tempans==1){ //had to separate if 1 second left because singular not plural (second vs seconds)
          $('#anstimer').html("<div class='noans normal_2' style='line-height:10px;'>You have <br/><span class='timer2'>" + tempans + " </span><br/>second to answer.</div>");$("#anstimer").bigText();
          audiotick.play();
     }
     if(tempans==0){
          clearInterval(ansVar); 
          $('#anstimer').html("<div class='noans normal_2'>Your turn is up!</div>");$("#anstimer").bigText();
          audio3.play();
     }
     if(tempans>0) tempans--;
}

function correctAns(){
     window[curr_led].off();
     can_led = 1;
     if(pt_index_curr==5){
          points_curr = (1)*(document.getElementById("bidvalue").value);
     }
     else{}
     if( (points_curr < 0) && (pt_index_curr==5)) alert("Bid must be positive.");
     else if(((points_curr%50)!=0) && (pt_index_curr==5)) alert("Bid must be divisible by 50.");
     else if((points_curr > scores[index_currteam]) && (pt_index_curr==5)) alert("Bid is greater than pot score.");
     else{
          scores[index_currteam] += points_curr;
          scoreboard();
          clearInterval(ansVar);
          done = true;
          $('#judgeans').hide();
          //update scoreboard
          //display that team got it right
          $('#checker').html("<div class='noans normal_2 scores'><img src='championship_style/correct.png' class='marks' height=80%>Your answer is correct.</div>");
          if(end_round){
               endRound();
          }
     }
}

function wrongAns(){
     // turnoff_leds();
     window[curr_led].off();
     can_led = 1;
     if(pt_index_curr==5){
          points_curr = (1)*(document.getElementById("bidvalue").value);
          deduc_curr = (-1)*points_curr;
     }
     else{}
     if( (points_curr < 0) && (pt_index_curr==5)) alert("Bid must be positive.");
     else if(((points_curr%50)!=0) && (pt_index_curr==5)) alert("Bid must be divisible by 50.");
     else if((points_curr > scores[index_currteam]) && (pt_index_curr==5)) alert("Bid is greater than pot score.");
     else{
          scores[index_currteam] += deduc_curr;
          scoreboard();
          clearInterval(ansVar);
          stealstate += 1; //add to current stealstate
          $('#checker').html("<div class='noans normal_2 scores'><img src='championship_style/wrong.png' class='marks' height=80%>Incorrect answer.</div>");
          $('#judgeans').hide();
          if(stealstate <= 2){ //can steal twice
               $('#stealbutton').show();
          }
          else{
               done = true; //means question is already done; cannot steal anymore
               if(end_round){
                    endRound();
               }
          }
     }

}

function steal(){
     console.log('steal!' + curr_led);
     go = true;
     $('#anstimer').html("");
     $('#buzzedteam').html("");
     $('#checker').html("");
     $('#stealbutton').hide();
     tempstealtime = stealtimelimit;
     $('#stealtimedisp').html("<div class='noans normal_2' style='line-height:10px;'>You have <br/><span class='timer2'>" + tempstealtime + "</span><br/> seconds to steal.</div>"); $("#stealtimedisp").bigText();
     tempstealtime--;
     stealVar=setInterval(function(){stealTimer()},1000); 
}

//').html("<div class='noans normal_2' style='line-height:10px;'>You have <br/><span class='timer2'>" + tempans + " </span><br/>seconds to answer</div>");$("#anstimer").bigText();

function stealTimer(){
     if(tempstealtime > 1){
          $('#stealtimedisp').html("<div class='noans normal_2' style='line-height:10px;'> You have <br/><span class='timer2'>" + tempstealtime + "</span><br/> seconds to steal.</div>"); $("#stealtimedisp").bigText();
     }
     else if(tempstealtime==1){ //had to separate if 1 second left because singular not plural (second vs seconds)
          $('#stealtimedisp').html("<div class='noans normal_2' style='line-height:10px;'> You have <br/><span class='timer2'>" + tempstealtime + "</span><br/> second to steal.</div>"); $("#stealtimedisp").bigText();
     }
     if(tempstealtime==0){
          clearInterval(stealVar); 
          $('#stealtimedisp').html("<div class='noans normal_2'>No steal!</div>"); $("#stealtimedisp").bigText();
          var audio2 = document.getElementById("timeup");
          audio2.play();
          done = true; //no one attempted to steal; quetion over
          go = false;
          if(end_round){
               endRound();
          }
          //audio3.play();
     }
     if(tempstealtime>0) tempstealtime--;

}

function endRound(){ //would determine here if there's a need for clincher
     $('#test').html("<div class='normal ranking' style='font-size: 80px;'>END OF ROUND</div>");
     $('#ranker').show();
     $('#question_board').hide();
     $('#test').show();
     $('#chooser').hide();

     //scores=[500,300,500,200,200]; //temporary //uncomment for tie breaker
     scoreboard();
     for(var i=0; i<teamnames.length; i++){
          teamnames_beforeRank[i] = teamnames[i];
          scores_beforeRank[i] = scores[i];	
     }
}

function afterDiff(){
     
     //rank teams here (teamnames[] and scores[])
     /*sortScores();
     text = "";
     for(var i=0; i<numteams; i++){
          text += teamnames[i] + ": ";
          text += scores[i] + "<br>";
     }


     
     text += "<input type='button' value='Press for Clincher' onclick='clincher()'/>"
     $('#test').html(text); //*/
     $('#ranker').hide();
     $('#test').show();
     $('#clinch').hide();
     $('#judgeans_clincher').hide();
     text = "";
     /* for(var i =0; i<numteams; i++){//DEBUGGING PURPOSES
     text += top[i]+"<br>"// will be used in clincher()
     }*/


     var counter = 0; //counts number of unresolved ties
     var counter2 = 0; //counter for number of teams whose positions are already settled in top 5
     var flag = 1; //flag for determining if top 5 are already settled
     //scores = pot_scores; <- no need for this; no pot_scores
     
     for( var i =0; i<5;i++){
          if (top[i] != 0)  {counter2 ++ ;}
     }
     if (counter2 == 5){//this means that top 5 is already settled
          flag= 0;
          // sortScores();
          //        text += "RANKING <br>";
               //      text += "pasok <br>";
     }else{

          sortScores();     //sort teams from highest to lowest score
     }
     sortScores();
     text += "<div class='normal ranking'>RANKINGS <br></div>";
     
     for(var i=0; i<numteams; i++){
          text += "<span class='teamname'>" + teamnames[i] + "</span>";
          text += "<span class='normal'>" + ": " + "</span>";
          text += "<span class='num scores noans'>" + scores[i] + "</span> ";
          
          if (flag==1 ){ //will go inside if there's still a need to settle the top 5 ranks
          if(scores[i] == scores[i+1] && top[i] == 0){// top is an array for the top 5 where the value is 1 when the place is already settled via clincher, 2 when tiebreak was disregarded and 0 when not yet settled
               counter++;
               text += "<br>";   
               }else if(counter != 0 ){
               var tempText = "";
               var temp;
               var start;
               start = i - counter;
               if (start<5){
               while (counter>=0){

                    temp = i - counter;
                    if (counter == 0 && temp<=4){
                         tempText += "and ";
                    }
                    if(temp == 0){
                         tempText += "first";
                    }else if(temp == 1){
                         tempText += "second";
                    }else if (temp == 2){
                         tempText += "third";
                    }else if (temp == 3){
                         tempText += "fourth";
                    }else if (temp == 4){
                         tempText += "fifth";
                    }
                    if (counter != 0 && temp<4){
                         tempText += ", ";
                    }
                    counter--;
               }
               counter++;
               text += "<br>";
               text += "<input type='button' class='go tie' value='Press to break tie for "+tempText+"' onclick='clincher("+start+", ";
               text +=  temp + ")'/>";
               // if (counter == 0 && temp<=4){
               text += "<input type='button' class='go disregard tie' value='Disregard' onclick='disregard("+start+", ";
               text +=  temp + ")'/>";       
               //     }
               
               text += "<br>";
               }
               if (i>=4){
               //if ( i>= 4){
                    flag =0;
               }
          } else {
               var x;
               
               if (top[i] == 0){
                    top[i] = 1;
                    if(i<5)     text += "       <span class='normal wrong winners'> (Rank "+ (i+1) +") </span>";
               }else{
                    if(i<5){
                         if(top[i] == 1){
                              text += "       <span class='normal wrong winners'> (Rank "+ (i+1) +") </span>";
                         }else if(top[i] == 2){
                         //var temp;
                              for (x = i;x>=0; x-- ){
                              if(scores[x] != scores[i]){
                                   x++;
                                   break;
                              }
                              }
                              if (x == -1) x++;
                              text += "       <span class='normal wrong winners'> (Tied Rank "+ (x+1) +") </span>";
                         }
                    }
               }
               text += "<br>";
          }
          } else{
          if (i<5){
               var x;
               if(top[i] == 1){
                    text += "       <span class='normal wrong winners'> (Rank "+ (i+1) +") </span>";
               }else if(top[i] == 2){
                         //var temp;
                              for (x = i;x>=0; x-- ){
                              if(scores[x] != scores[i]){
                                   x++;
                                   break;
                              }
                              }
                              if (x == -1) x++;
                              text += "       <span class='normal wrong winners'> (Tied Rank " + (x+1) +") </span>";
               }
          }
          text += "<br>";
          }
     }

     

     $('#test').html(text); 
}

function disregard(start, end) { //if a user chose to disregard a tie
          for( var i =start; i<=end;i++){
               top[i]=2;
          }
          afterDiff();

}
function clincher( start, end ){ //edit this function for clincher round
     $('#last').hide();
     $('#bidtimer').hide();
     $('#bidtimebutton').hide();
     $('#diff_scoreboard').hide();
     $('#clinch').show();
     var place;
     place = start;

     text = "";

     for(var i=start; i<=end; i++){
          text += "<span class='teamname'>" + teamnames[i] + "</span>";
          text += "<span class='normal'>" + ": " + "</span>";
          text += "<input type='button' value='/' class='go' onclick='clinchCor("+i+", "+place+", "+ end +")'/> <br>";
     }
     $('#clinch').html(text);
     clincher2(start,end);
}
function clinchCor(winner,place,end){
     go = false;	//new
     clearInterval(ansVar);
     clearInterval(timeVar);

     var tempName;
     var tempScore;
     tempName = teamnames[place];
     tempScore = scores[place];
     teamnames[place] = teamnames[winner];
     scores[place] = scores[winner];
     for (var i=winner-1; i>place; i--){
          teamnames[i+1] = teamnames[i];
          scores[i+1] = scores[i];
     }
     if(winner != place){
          teamnames[place+1] = tempName; 
          scores[place+1] = tempScore; 
     }
     top[place] = 1;

     if (place == 4 || (place+1 == end)){
          top[place+1] = 1;
          if(place == 4){
          for( var i =5; i<numteams;i++){
               top[i]=1;
          }
          }
          afterDiff();

     }else{
          clincher(place+1,end);
     }
     
}

var num_tie_teams;
var teamnames_temp = new Array();
var place;
var end2;
var start2;
function clincher2( start, end ){ //edit this function for clincher round; start and end parameters are start and end indices of teams for clincher
     $('#test').show();
     $('#clinch').show();
     $('#nextques').hide();

     $('#checker').html("");
     $('#buzzedteam').html("");
     $('#anstimer').html("");
     $('#stealtimedisp').html("");
     $('#timer').html("");


     clinch_state = true;

     num_tie_teams = (end - start + 1);
     place = start;
     //go = true; //not yet go, go will be true once bidding is over
     tie_breaker = true;
     blocked=[true,true,true,true,true]; //block all teams initially (they can't press their buzzer)

     //$('#bidbutton').show();
     //currently_bidding_clinch = true;
     $('#timerbutton').show(); //new
     go = true;	//new

     scoreboard(); //just to see how scoreboard will look after rearranging
     var old_index;
     teamnames_temp = new Array();
     text = "";
     text = "<span class='normal ranking'>Tie breaker between<br></span>";
     for(var i=start; i<=end; i++){
          old_index = teamnames_beforeRank.indexOf(teamnames[i]); //gets old index before ranking for blocked[]
          blocked[old_index] = false; //means teams in tie breaker should be unblocked
          text += "<span class='teamname'>"
          text += teamnames[i];
          text += "</span><br>";
          teamnames_temp.push(teamnames[i-start]); //stores teams' names whose ties are to be broken
     }

     $('#test').html(text);

     start2 = start;
     end2 = end;

}

function resetBuzzer(){
     clearInterval(ansVar);
          //$('#checker').html("Your answer is correct.");
     $('#timer').html("");
     $('#stealtimedisp').html("");
     $('#anstimer').html("");
     $('#ranker').hide();
     $('#test').show();
     $('#clinch').hide();
     $('#judgeans_clincher').hide();
     text = "";
     clincher2(start2,end2);
}

function nextQues(){
     go = true;
     $('#nextques').hide();
     $('#timerbutton').show();
     $('#timer').html("");
}



function sortScores(){ //fix this (additional feature if ever)
     //var arranged_teams = teamnames;
     //var arranged_scores = scores;
     // var swapped;
     // do {
     //      swapped = false;
     //      for (var i=0; i < scores.length-1; i++) {
     //           if (scores[i] < scores[i+1]) {
     //                var temp = scores[i];
     //                scores[i] = scores[i+1];
     //                scores[i+1] = temp;
                    
     //                var temp_team = teamnames[i];
     //                teamnames[i] = teamnames[i+1];
     //                teamnames[i+1] = temp_team;				
                    
     //                swapped = true;
     //           }
     //      }
     // } while (swapped);
     console.log('sorting...');
     for(var i = 0; i < scores.length; i++){
          console.log(i);
          for(var j = 0; j < scores.length; j++){
               if(scores[i] > scores[j]){
                    var temp = scores[i];
                    scores[i] = scores[j];
                    scores[j] = temp;
     
                    var temp_team = teamnames[i];
                    teamnames[i] = teamnames[j];
                    teamnames[j] = temp_team;
               }
          }
     }

     console.log('Final Scores: ' + scores);
}



function submitNames(){
     $('#times').show();
     $('#team_display').show();
     $('#all_scoreboard').show();
     $('#question_board').show();
     $('#teams').hide();
     $('#chooser').show();
     $('#buttons').show();

     var name="";
     for(var i=0; i<numteams; i++){
          name="team" + (i+1);
          teamnames.push(document.getElementById(name).value)
     }

     //teamnames = ['Team A','Team B','Team C','Team D','Team E']; //comment this out later; temporary; nakakatamad magtype ng team names lol; TEMP

     for(var i =0; i<numteams; i++){
          top[i] = 0;// will be used in clincher()
     }

     for(var i=0; i<points.length; i++){
          var temp = new Array();
          for(var j=0; j<categories.length; j++){
               temp[j]=0; //TEMP set to 1; change this back to 0 later; temporary
                    //CHANGE TO 1 for tie breaker
          }
          ques_done.push(temp);
     }
     

     generateQuestionBoard();
     
     document.onkeypress=keyfunction;
}

function generateQuestionBoard(){
     scoreboard();
     $('#teams').hide();
     $('#stealtimedisp').html("");
     $('#questions').show();
     $('#timer').show();
     //$('#timerbutton').show();
     $('#confirmques').show();
     $('#buzzedteam').show(); $('#buzzedteam').bigText();
     var text = "";
     text += "<TABLE class='table_cat hor_center text_center'><tr class='header'><td class='header_pad scoreboard'>"+categories[0]+"</td>";
     text += "<td class='header_pad scoreboard'>"+categories[1]+"</td>";
     text += "<TD class='header_pad scoreboard'>"+categories[2]+"</TD>";
     text += "<TD class='header_pad scoreboard'>"+categories[3]+"</TD>";
     text += "<TD class='header_pad scoreboard'>"+categories[4]+"</TD></tr>";
     for(var i=0; i<points.length; i++){
          text += "<tr class='box'>";
          for(var j=0; j<categories.length; j++){
               text += "<td class='lines scoreboard' align='center'><DIV id='ques"+i+j+"'>"+"<INPUT type='button' class='noans answer' style='width:90px;' value='"+points[i]+"'";
               text += "onclick='questionChosen("+i+","+j+")'></div></td>";	
          }
          text += "</tr>";
     }
     text += "</TABLE>";
     $('#questions').html(text);
     isqueschosen = false;
     updateChosen();	//would hide already chosen questions
     if(end_round){
          endRound();
     }
}

function questionChosen(pt_index,categ_index){
     if(done){
          var text = categories[categ_index] + " " +points[pt_index];
          $('#quesChosen').html(text); $("#quesChosen").bigText(); //auto-adjust font size to fit container
          $('#stealbutton').hide();
          $('#checker').html("");
          $('#buzzedteam').html("");
          $('#anstimer').html("");
          $('#stealtimedisp').html("");
          $('#timer').html("");
          generateQuestionBoard();
          pt_index_curr = pt_index;
          categ_index_curr = categ_index;
          isqueschosen = true;
          text = "";
          text = "<INPUT type='button' class='cat_click' value='"+points[pt_index]+"' ";
          text += "onclick='questionChosen("+pt_index+","+categ_index+")'>";
          var temp ="";
          temp = "#ques" + pt_index + categ_index;
          $(temp).html(text);
     }
}

function confirmQuestion(){
     if(isqueschosen && done){
          isqueschosen = false;
          //var temp = "";
          //temp = "#ques" + pt_index_curr + categ_index_curr;
          ques_done[pt_index_curr][categ_index_curr] = 1;
          //$(temp).html(text);
          points_curr = points[pt_index_curr];
          deduc_curr = ((-1)*points_curr);
          go = true;
          if(pt_index_curr ==5){ //for bidding; will ask for bid later
               points_curr = 0;
               deduc_curr = 0;
               go = false; //no team is allowed to buzz yet
          }
          
          done = false;
          blocked = [false,false,false,false,false]; //unblock all teams since question has just been chosen
          stealstate = 0; //goes back to zero
          if(pt_index_curr==5){
               //insert here the bidding time for all teams
               $('#bidbutton').show();
               currently_bidding = true;
          }
          else{
               $('#timer').show(); $("#timer").bigText();
               $('#timerbutton').show();
          }
          //generateQuestionBoard();
          updateChosen();
     }
}//*/

function updateChosen(){ //use ques_done array to prevent certain questions from being chosen again
     var temp="";
     end_round = true;
     for(var i=0; i<points.length; i++){
          for(var j=0; j<categories.length; j++){
               temp = "#ques" + i + j;
               if(ques_done[i][j]){
                    $(temp).html(points[i]);
                    end_round = (end_round && true); //check if all questions are already chosen (means round is about to end)
               }
               else{
               var text = "<INPUT type='button' class='noans answer' style='width:90px;' value='"+points[i]+"'";
               text += "onclick='questionChosen("+i+","+j+")'>";
               $(temp).html(text);
                    end_round = false; //will be false if at least one question hasn't been chosen yet
               }
          }
     }
}

var timeVar;
var time;
function startTime(){
     if(clinch_state){
          $('#clear_clinch').show();
     }
     go = true;

     time = time_limit;
     $('#timerbutton').hide();
     $('#bidbutton').hide();
     $('#timer').html(time); $("#timer").bigText();
     time--;
     timeVar = setInterval(function(){countdown()},1000);
}
function countdown(){
     $('#timer').html(time); $("#timer").bigText();
     if(time==0) {
          clearInterval(timeVar);
          var audio2 = document.getElementById("timeup");
          audio2.play();
          if(currently_bidding){ //recycling since it would take 10 seconds for both
               $('#timer').html("<div class='noans normal_2'>Bid time over.</div>"); $('#timer').bigText();
               currently_bidding = false;
               $('#timerbutton').show();
               go = true; //teams are now allowed to buzz
          }
          else{
               $('#timer').html("<div class='noans normal_2'>Time's up!</div>"); $("#timer").bigText();
               done = true; //no one tried to answer; question is done
               go = false;
               if(clinch_state){ //here if clincher round and time up for question
                    $('#judgeans_clincher').show();
                    $('#clear_clinch').hide();
                    $('#nextques').show();

               }
          }
          if(end_round && (!tie_breaker)){
               endRound();
          }
     }
     else time--;
}

function scoreboard(){
     text = "";
     text = "TABLE class='table text_center'>";
     /*text = "<TABLE  style='width:90%; margin-right:auto; margin-left:auto; position: relative; top: 50%; transform: translateY(-50%); text-align:center'>";*/
     text += "<tr class='header'><td style='width:90%;'>Team Name</td>";
     text += "<td>Score</td></tr>";
     for(var i=0; i<teamnames.length; i++){
          //if(scores[i] < 0) scores[i]=0; //no score can be less than zero
          text += "<tr class='box'><td class='teamname lines'>" + teamnames[i] +"</td>";
          text += "<td class='num lines' id='" + ('A' + i) + "2'>" + scores[i] + "</td></tr>";
     }
     $('#all_scoreboard').html(text);
}

$(function() {
     $( "#dialog" ).dialog();
     $( "#dialog" ).dialog( "open" );
     $( "#dialog" ).dialog( "close" );
     $( "#dialog" ).dialog( "option", "minWidth", 520 );
     $( "#dialog" ).dialog( "open" );
     $( "#dialog" ).dialog( "close" );
});