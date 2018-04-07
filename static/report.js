
(() => {
  var supplies = [];
  window.supplies = supplies;

  function Report() {

  }

  Report.prototype.render = function render(row) {
    console.log(row);
    var supply = {
      SupplyId:             row.SupplyId,
      Supplies_cost:        row.Supplies_cost,
      Supplies_description: row.Supplies_description,
      Supplies_type:        row.Supplies_type,
      Supplies_unit:        row.Supplies_unit,
      APU: [{
        APUId:              row.APUId,
        APU_description:    row.APU_description,
        APU_is_estimated:   row.APU_is_estimated,
        APU_unit:           row.APU_unit
        Tasks_start:        row.Tasks_start,
        Tasks_end:          row.Tasks_end
      }]
    };
    var found = supplies.find(d => d.SupplyId == supply.SupplyId);
    if (found) {
      found.APU.push(supply.APU[0]);
    } else {
      supplies.push(supply);
    }
  }

  window.report = new Report();
})();
