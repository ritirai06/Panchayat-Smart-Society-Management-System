import BuildingCard from './BuildingCard'

export default function TowerSection({ towers, selectedTower, onTowerDetail }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Society Towers</h3>
          <p className="text-sm text-zinc-500">Tap a tower to open the flats view</p>
        </div>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible md:snap-none">
        {towers.map((tower) => (
          <div key={tower.name} className="min-w-[86%] snap-start md:min-w-0">
            <BuildingCard
              tower={tower}
              active={selectedTower === tower.name}
              onClick={() => onTowerDetail(tower)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
