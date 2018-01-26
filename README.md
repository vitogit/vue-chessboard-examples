# vue-chessboard-examples

 Examples for the [vue-chessboard component](https://github.com/vitogit/vue-chessboard) 

![http://g.recordit.co/40JDuy8tAk.gif](http://g.recordit.co/40JDuy8tAk.gif)


# Examples 

  Check live examples: [http://vitomd.com/vue-chessboard-examples/](http://vitomd.com/vue-chessboard-examples/)
  
  Check full application using the component: [Chess Guardian](http://vitomd.com/vue-chess-guardian/)

  #### Simple Chessboard with legal moves
  ```html
    <chessboard/>
  ```
  #### Simple Chessboard with free moves
  ```html
    <chessboard :free="true"/>
  ```
  
  #### Simple Chessboard that shows threats for current position and player
  ```html
    <chessboard :showThreats="true"/>
  ```
  
  #### Fen binded to the chessboard (load position when click on a new position)
  ```html
    <chessboard :fen="currentFen"/>
    <button class="button is-light" @click="loadFen(fen)" v-for="fen in fens">
      {{fen}}
    </button>
  ```
  
  #### Simple Chessboard with legal moves
  ```html
    <chessboard @onMove="showInfo"/>
    <div>
      {{this.positionInfo}}
    </div>
  ```

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```
