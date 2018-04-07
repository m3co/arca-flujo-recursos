
(() => {
  var DTSym = Symbol();
  var supplies = [];
  var periods = [];
  window.supplies = supplies;
  window.periods = periods;

  function Report() {

  }

  Report.prototype.render = function render(row) {
    var found;
    var period = {
      start: row.start,
      end: row.end
    };
    period[DTSym] = `${row.start.toISOString()}-${row.end.toISOString()}`;
    found = periods.find(d => d[DTSym] == period[DTSym]);
    if (!found) {
      periods.push(period);
    }
    var APU = {
      APUId:              row.APUId,
      APU_description:    row.APU_description,
      APU_is_estimated:   row.APU_is_estimated,
      APU_unit:           row.APU_unit,
      Tasks_start:        row.Tasks_start,
      Tasks_end:          row.Tasks_end,
      periods: [period]
    };
    var supply = {
      SupplyId:             row.SupplyId,
      Supplies_cost:        row.Supplies_cost,
      Supplies_description: row.Supplies_description,
      Supplies_type:        row.Supplies_type,
      Supplies_unit:        row.Supplies_unit,
      APU: [APU]
    };

    found = supplies.find(d => d.SupplyId == supply.SupplyId);
    if (found) {
      found.APU.push(APU);
    } else {
      supplies.push(supply);
    }
  }

  window.report = new Report();
})();
