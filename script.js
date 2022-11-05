// Constants
let fatCaloriesPerGram = 9
let carbsCaloriesPerGram = 4
let proteinCaloriesPerGram = 4
let moveGoal = 440
let exerciseGoal = 30
let standGoal = 12

let specs = { }

specs.colors = {
    "active_energy" : "rgb(252, 48, 130)",
    "apple_exercise_time" : "rgb(172, 251, 5)",
    "apple_stand_hour" : "rgb(8, 246, 210)",
    "background" : "#000d2a"
}

var state = { }

let scene = new THREE.Scene()
scene.background = new THREE.Color(specs.colors.background)
let camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 10000)
let container = new THREE.Group()
scene.add(container)
let renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer : true
})
let ambient = new THREE.AmbientLight(0x404040, 3)
scene.add(ambient)
let light = new THREE.DirectionalLight(0x404040, 5)
light.position.set(0,0,1000)
scene.add(light)

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

/// Returns a date from a "Health Export" date string
function dateFromHealthExportDateString(dateString) {
    let date = dateString.split(' ')[0]
    let year = date.split('-')[0]
    let month = date.split('-')[1]
    let day = date.split('-')[2]

    let time = dateString.split(' ')[1]
    let hour = time.split(':')[0]
    let minute = time.split(':')[1]
    let second = time.split(':')[2]

    let gmtOffset = dateString.split(' ')[2]

    var outDate = new Date(date)

    outDate.setDate(outDate.getDate() + 1)
    outDate.setHours(Number.parseInt(hour))
    outDate.setMinutes(Number.parseInt(minute))
    outDate.setSeconds(Number.parseInt(second))

    return outDate
}

/// Returns the date without hours, minutes, or seconds
function dateStrippingTimeComponents(date) {
    var out = date
    out.setHours(0)
    out.setMinutes(0)
    out.setSeconds(0)
    return out
}

/// Aggregates data by day for a metric item
/// Returns an ordered array, from oldest to newest, of dictionaries
/// The keys are:
/// - data - a set of data items that occurred on this day
/// - date - the date the data items occurred on
/// - sum - a sum of the data for this day
function aggregateDataByDay(metricItem) {
    let data = metricItem['data']

    var out = new Array()
    var currentDateTime = 0
    var currentItem = null

    for (var datum of data) {
        var datumDate = dateStrippingTimeComponents(dateFromHealthExportDateString(datum['date']))
        if (currentDateTime != datumDate.getTime()) {
            if (currentItem != null) {
                out.push(currentItem)
            }
            currentDateTime = datumDate.getTime()
            currentItem = { }
            currentItem['date'] = datumDate
            currentItem['data'] = new Array()
            currentItem['sum'] = 0
        }
        else {
            currentItem['data'].push(datum)
            currentItem['sum'] = currentItem['sum'] + datum['qty']
        }
    }

    return out
}

function prettyUnit(unitName) {
    var out = unitName.replace('count', '')
    return out
}

function outlinedNode(geo, color) {
    // let out = new THREE.Group()
    // let regularMaterial = new THREE.
    // return out()
}

function cube() {
    let geo = new THREE.BoxGeometry(100, 100, 100)
    let mat = new THREE.MeshBasicMaterial({color: 0xff0000})
    return new THREE.Mesh(geo, mat)
}

// Returns a group representing activity rings
function activityRings(move, exercise, stand) {
    let activity = new THREE.Group()
    let moveArc = move.sum / moveGoal * Math.PI * 2
    let exerciseArc = exercise.sum / exerciseGoal * Math.PI * 2
    let standArc = stand.sum / standGoal * Math.PI * 2

    function activityRing(arc, level, color, rotated) {
        let clampedArc = Math.min(arc, Math.PI * 2)
        let geo = new THREE.TorusGeometry(100 - (level * 30), 10, 80, 60, clampedArc)
        let material = new THREE.MeshPhysicalMaterial({color: new THREE.Color(color)})
        material.transparent = true
        material.opacity = 0.5
        let node = new THREE.Mesh(geo, material)

        let rotate = new TWEEN.Tween(node.rotation)
        .to(rotated, 5000 + (Math.random() * 1000))
        .repeat(Infinity)
        .delay(Math.random() * 1000)
        .repeatDelay(0)
        .start()

        return node
    }

    let dest = Math.PI * 2
    activity.add(activityRing(moveArc, 0, specs.colors.active_energy, { x : dest, y: dest }))
    activity.add(activityRing(exerciseArc, 1, specs.colors.apple_exercise_time, { y : dest, z: dest }))
    activity.add(activityRing(standArc, 2, specs.colors.apple_stand_hour, { z : dest, x: dest }))

    return activity
}

function layout() {
    camera.position.z = 1000 * window.innerHeight / window.innerWidth
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.width = window.innerWidth
    renderer.domElement.height = window.innerHeight

    state.minX.position.x = -window.innerWidth/2
    state.maxX.position.x = window.innerWidth/2
    state.minY.position.y = -window.innerHeight/2
    state.maxY.position.y = window.innerHeight/2
}

function update(dataContents) {
    let data = dataContents['data']
    let metrics = data['metrics']
    let workouts = data['workouts']

    var metricsByType = {}
    for (var metric of metrics) {
        metricsByType[metric.name] = metric
    }

    let move = aggregateDataByDay(metricsByType.active_energy)
    let exercise = aggregateDataByDay(metricsByType.apple_exercise_time)
    let stand = aggregateDataByDay(metricsByType.apple_stand_hour)

    for (var i = 0; i < move.length; i++) {
        let rings = activityRings(move[i], exercise[i], stand[i])
        rings.position.x += (i - move.length/2) * 300
        container.add(rings)
    }

    let minX = cube()
    let maxX = cube()
    let minY = cube()
    let maxY = cube()

    container.add(minX)
    container.add(maxX)
    container.add(minY)
    container.add(maxY)
    
    state.minX = minX
    state.maxX = maxX
    state.minY = minY
    state.maxY = maxY

    layout()
}

async function doLoad() {
    let request = new Request('data.php')
    fetch(request)
    .then(response => {
        return response.json()
    })
    .then(json => {
        update(json)
    })
}

function animate() {
    requestAnimationFrame( animate )
    TWEEN.update()
    renderer.render(scene, camera)
}

window.onload = function() {
    doLoad()
    animate()
}

window.onresize = layout
