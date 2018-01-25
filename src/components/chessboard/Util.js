export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function uniques(arr){
    let unique_array = arr.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
    });
    return unique_array
}
