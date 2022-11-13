import * as MetricNode from './metric_node.js'

class Activity extends MetricNode.MetricNode {
    name = "Activity"
    matchesTypes(metricTypes) {
        return metricTypes.includes('active_energy') &&
               metricTypes.includes('apple_exercise_time') &&
               metricTypes.includes('apple_stand_hour')
    }

    update(data) {
        let moveArc = (data.active_energy.sum / moveGoal) * Math.PI * 2
        let exerciseArc = (data.apple_exercise_time.sum / exerciseGoal) * Math.PI * 2
        let standArc = (data.apple_stand_hour.sum / standGoal) * Math.PI * 2

        this.updateRing(0, self.moveNode, moveArc)
        this.updateRing(1, self.exerciseNode, exerciseArc)
        this.updateRing(2, self.standNode, standArc)
    }

    updateRing(level, ring, arc) {
        console.log(ring)
        console.log(arc)
        let clampedArc = Math.max(0, Math.min(arc, Math.PI * 2))
        let geo = new THREE.TorusGeometry(100 - (level * 30), 10, 8, 16 * (arc / Math.PI*2), clampedArc)
        ring.children[0].geometry = geo
        ring.children[1].geometry = geo
        console.log(ring.children[0].geometry)
        console.log(ring.children[1].geometry)
    }

    activityRing(arc, level, color) {
        let clampedArc = Math.max(0, Math.min(arc, Math.PI * 2))
        let geo = new THREE.TorusGeometry(100 - (level * 30), 10, 8, 16 * (arc / Math.PI*2), clampedArc)
        let node = outlinedNode(geo, color)
        node.rotation.z = -Math.PI/2

        return node
    }

    constructor() {
        self = super()
        self.moveNode = this.activityRing(0, 0, colorVariable("tint1"))
        self.exerciseNode = this.activityRing(0, 1, colorVariable("tint2"))
        self.standNode = this.activityRing(0, 2, colorVariable("tint3"))
        self.node.add(self.moveNode)
        self.node.add(self.exerciseNode)
        self.node.add(self.standNode)
    }
}

export { Activity }

