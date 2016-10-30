interface IGameOfLife {
    div: HTMLElement;
    width?: number;
    height?: number;
    clear?: boolean;

    checkAllCells: () => ICell[];
    implementChanges: (toChange: ICell[]) => void;
}

interface ICell {
    x: number;
    y: number;
}

class Game implements IGameOfLife {
    grid: Array<Array<HTMLInputElement>> = [];

    constructor(public div: HTMLElement, public width: number = 5, public height: number = 5, public clear?: boolean) {
        this.generateCheckboxes();
        if (!clear) this.initialRandom();
    }

    private createCheckbox(): HTMLInputElement {
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        return checkbox;
    }

    private generateCheckboxes() {
        for (var y = 0; y < this.height; y++) {
            var row = new Array<HTMLInputElement>();
            for (var x = 0; x < this.width; x++) {
                var checkbox = this.createCheckbox();
                row.push(checkbox);
                this.div.appendChild(checkbox);
            }
            this.grid.push(row);
            this.div.appendChild(document.createElement("br"));
        }
    }

    private initialRandom() {
        this.grid.forEach(
            row => row.forEach(
                checkbox => checkbox.checked = ((): boolean => { return Math.random() < 0.5 ? false : true; })()));
    }

    public implementChanges(toChange: ICell[]) {
        toChange.forEach(
            coord => this.grid[coord.y][coord.x].checked = !this.grid[coord.y][coord.x].checked, this);
    }

    public checkAllCells() {
        var toChange = new Array<ICell>();
        this.grid.forEach(
            (row, y) => row.forEach(
                (checkbox, x) => {
                    var cell = { x: x, y: y };
                    var numberOfLiveCellsAround = this.checkAllDirections(cell);

                    if (checkbox.checked ? this.shouldDie(numberOfLiveCellsAround) : this.shouldLive(numberOfLiveCellsAround))
                        toChange.push({ x: x, y: y });
                }
                , this)
            , this);

        return toChange;
    }

    private shouldDie(numberOfLiveCellsAround: number) {
        if (numberOfLiveCellsAround < 2 || numberOfLiveCellsAround > 3)
            return true; // Should die.
        else
            return false; // Else continue living.
    }

    private shouldLive(numberOfLiveCellsAround: number) {
        if (numberOfLiveCellsAround == 3)
            return true; // Phoenix Down! Should live!
        else
            return false; // Still dead.
    }

    private checkAllDirections(cell: ICell): number {
        var numberOfLiveCells = 0;
        for (var _y = -1; _y <= 1; _y++) {
            for (var _x = -1; _x <= 1; _x++) {
                if (_x || _y) {                       // If both _x and _y are 0, the following isn't run
                    var Y = cell.y + _y;
                    var X = cell.x + _x;
                    if (-1 < X && X < this.width
                        && -1 < Y && Y < this.height) {
                        if (this.grid[Y][X].checked) numberOfLiveCells++;
                    }
                }
            }
        }
        return numberOfLiveCells;
    }

}

// ==== NEW MAIN ==========

var grid = <HTMLDivElement>document.getElementById("grid");

var width = <HTMLInputElement>document.getElementById("width");
var height = <HTMLInputElement>document.getElementById("height");

var start = <HTMLButtonElement>document.getElementById("start");
var clear = <HTMLButtonElement>document.getElementById("clear");
var randomize = <HTMLButtonElement>document.getElementById("randomize");

var gameOfLife = new Game(grid, Number(width.value), Number(height.value));

var running = false;

var interval;
start.addEventListener("click", () => {
    if (!running) {
        running = true;
        interval = setInterval( () => {
            var toChange = gameOfLife.checkAllCells();
            // If life has reached a stable state, clear interval 
            toChange.length ? gameOfLife.implementChanges(toChange) : clearInterval(interval);
        }, 150);
    }
});

function reDrawHandler(clear?: boolean) {
    return (event) => {
        if (interval) clearInterval(interval);
        while (grid.firstChild) grid.removeChild(grid.firstChild);
        running = false;
        gameOfLife = new Game(grid, Number(width.value), Number(height.value), clear);
    }
};

width.addEventListener("change", reDrawHandler());
height.addEventListener("change", reDrawHandler());
clear.addEventListener("click", reDrawHandler(true));
randomize.addEventListener("click", reDrawHandler());