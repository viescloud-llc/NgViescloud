import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs';
import { Question } from 'projects/viescloud-utils/src/lib/model/VGame.model';
import { VGameService } from 'projects/viescloud-utils/src/lib/service/VGame.service';

@Component({
  selector: 'app-general-questions',
  templateUrl: './general-questions.component.html',
  styleUrls: ['./general-questions.component.scss']
})
export class GeneralQuestionsComponent implements OnInit {

  questions: Question[] = [];

  maxQuestion: number = 0;

  maxPoint: number = 0;

  lock: boolean = false;

  score: number = 0;
  point: number = 0;

  message: string = '';

  category: string = '';

  constructor(
    private vgameService: VGameService
  ) { }

  ngOnInit() {
    // this.init();
  }

  init() {
    let exampleQuestion: Question = {
      category: this.category
    }

    this.vgameService.getAnyMatchQuestions(exampleQuestion).pipe(first()).subscribe(
      res => {
        this.preprocess(res);
        this.questions = res;
        this.lock = false;
        this.message = '';
      }
    );
  }

  preprocess(questions: Question[]) {
    this.maxPoint = 0;
    this.shuffle(questions);
    this.maxQuestion = 1 + Math.floor(Math.random() * questions.length);

    while(questions.length > this.maxQuestion) {
      questions.pop();
    }

    questions = questions.sort((a, b) => a.orderBy! - b.orderBy!)

    questions.forEach(q => {
      q.answer?.correctAnswer?.forEach(ca => {
        this.maxPoint += q.answer?.pointPerCorrectAnswer!;
      });
      q.selectedAnswer = [];
      q.possibleAnswer?.forEach(e1 => {
        q.selectedAnswer?.push('');
      })
    })
  }

  shuffle(questions: Question[]) {
    let randomSeed = Math.floor(Math.random() * 100);
    for(let i = 0; i < randomSeed; i++) {
      let pos1 = Math.floor(Math.random() * questions.length);
      let pos2 = Math.floor(Math.random() * questions.length);
      let pos1Value = structuredClone(questions[pos1]);
      let pos2Value = structuredClone(questions[pos2]);
      questions.splice(pos1, 1, pos2Value);
      questions.splice(pos2, 1, pos1Value);
    }
  }

  seeResult() {
    this.lock = true;
    let totalPoint = 0;
    this.questions.forEach(q => {
      let point = q.answer!.pointPerCorrectAnswer!;
      q.selectedAnswer!.forEach(sa => {
        if(q.answer!.correctAnswer!.indexOf(sa) >= 0) 
          totalPoint += point;
        else if(sa) 
          totalPoint -= point;
        
      })
    })

    this.point = totalPoint;
    if(this.point < 0)
      this.point = 0;
    this.score = (100 / this.maxPoint) * this.point;

    if(this.score >= 90)
      this.message = 'A+'
    else if(this.score >= 85)
      this.message = 'A'
    else if(this.score >= 80)
      this.message = 'A-'
    else if(this.score >= 75)
      this.message = 'B+'
    else if(this.score >= 70)
      this.message = 'B'
    else if(this.score >= 65)
      this.message = 'C+'
    else if(this.score >= 60)
      this.message = 'C'
    else if(this.score >= 55)
      this.message = 'D+'
    else if(this.score >= 50)
      this.message = 'D'
    else if(this.score >= 40)
      this.message = 'E'
    else
      this.message = 'F'
  }

  selectAnswer(question: Question, index: number, input: HTMLInputElement):void {
    if(input.checked) {
      question.selectedAnswer![index] = input.value;
    }
    else {
      question.selectedAnswer![index] = "";
    }
  }

  reset() {
    this.init();
  }
}
