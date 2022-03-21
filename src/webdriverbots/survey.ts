
export class Survey{

    question: string
    answers: string[]
    users: Map<string, number>;

    constructor(question: string, answers: string[]){
        this.question = question;
        this.answers = answers;
        this.users = new Map();
    }

    vote(index: number, user: string){
        this.users.set(user,index);
    }

    getResults(){
        for(let i = 0; i < this.answers.length; i++){
            this.users.values;
        }
    
        return 'yeah';
    }




}