import ProgressBar from 'progressbar.js'

let progressCircle = new ProgressBar.Circle('#progress', {
    // color: 'black',
    strokeWidth: 4,
    trailWidth: 4,
    duration: 800,
    text: {
        value: ""
    },
    fill: 'rgb(206, 206, 206)',
    from: { color: '#42f4a7' },
    to: { color: '#f45641' },
    step: function(state, circle, attachment) {
        circle.path.setAttribute('stroke', state.color);
    }
});

let progressIcon = document.createElement("i")
progressIcon.className = "fas fa-bolt"
progressIcon.style.color = "black"
progressIcon.style.position = "absolute"
progressIcon.style.left = "50%"
progressIcon.style.top = "50%"
progressIcon.style.padding = 0
progressIcon.style.margin = 0
progressIcon.style.transform = 'translate(-45%, -50%)'
progressIcon.style.fontSize = "4em"
document.getElementById("progress").appendChild(progressIcon)

export { progressCircle, progressIcon }
