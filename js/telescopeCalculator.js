// ok it would be cool to have a table where relationships are enforced
// e.g., all values are related through some formula, and if you change one of them it updates the rest?
// or would it be better to have a list of inputs, and then change a small number of updateable fields?
// I think that'd be easier to pop out quick -
// so I'd want to make a table that corresponds to a JSON-built object
// and you'll enter telescope aperature and focal length AND (?) focal ratio?

console.log('Telescope Calculator');

var activeCameras = ['Marana']; // list of active cameras

// table headers
headers = ['Andor Camera', 'Telescope Aperture (mm)', 'Focal Ratio (f/#)',
'Focal Length (mm)', 'CCD Size (mm)_xy', 'Pixel Size (\u03BCm)',
'FOV, \xB0_xy', 'FOV (arcmin)_xy',
'Image Scale (arcsec/pixel)', 'Calculated CCD Size (K)_xy',
'Image Size in Telescope Focal Plane (mm)_xy',
'Approx. Minimum Pixel Size (\u03BCm) to Avoid Oversampling',
'Average Seeing (arcsec)', 'D of Image (mm), Square Sensor',
'D of Image (mm), Rectangular Sensor'];

// lets try to make a table from the camera info object

function createTable(targetDiv){
    var dataTable = d3.select('#'+targetDiv).append('table')
    //add headers
    function roundIfNumber(x){
        if (!isNaN( Number(x) ) ){
            return Math.round(x*100)/100
        }
        return x;
    }

    var dataTableHead = dataTable.append('tr')
    headers.forEach(function(label){
        var colWidth = 1;
        if (label.split('_')[1] == 'xy'){
            label = label.split('_')[0];
            colWidth = 2;
        }
        var newEntry = dataTableHead.append('th');
        newEntry.text(label);
        newEntry.attr('colspan', colWidth);
    })

    var secondaryLabels = dataTable.append('tr').attr('class','subHead')
        secondaryLabels.append('td').text('').attr('colspan', 4)
        secondaryLabels.append('td').text('x')
        secondaryLabels.append('td').text('y')
        secondaryLabels.append('td').text('')
        secondaryLabels.append('td').text('x')
        secondaryLabels.append('td').text('y')
        secondaryLabels.append('td').text('x')
        secondaryLabels.append('td').text('y')
        secondaryLabels.append('td').text('')
        secondaryLabels.append('td').text('x')
        secondaryLabels.append('td').text('y')
        secondaryLabels.append('td').text('').attr('colspan', 6)

    cameras.forEach(function(entry){
        if (activeCameras.indexOf(entry['Andor Camera']) != -1){
            console.log(entry['Andor Camera'], activeCameras.indexOf(entry['Andor Camera']))
            var row = dataTable.append('tr').attr('class','mainTable');
            var keys = Object.keys(entry);
            for (k in keys){
                row.append('td').text( roundIfNumber( entry[keys[k]] ) );
            }
        }
    })
    return dataTable; // return table selection
}

function updateTable(){
    d3.select('table').remove();
    createTable('tableDiv')
}


var controlDiv = d3.select('body')
                    .append('div')
                    .attr('id', 'controlDiv')

var inputDiv = d3.select('#controlDiv')
                    .append('div')
                    .attr('id','inputDiv')

inputDiv.append('div').attr('class','inputLabel').text('Input Telescope Parameters')

var tableDiv = d3.select('body')
                    .append('div')
                    .attr('id','tableDiv')

var mainTable = createTable('tableDiv');

// create input fields

function makeInput(configObj){
    var inputSelection = d3.select('#inputDiv')
                        .append('div')
                        .append('span')
                        .attr('class','fieldLabel')
                        .text(configObj.label + '  ')
                        .append('input')
                        .attr('id',configObj.shortName + 'Input')
                        .attr('value',configObj.initialValue)
                        .attr('type','text')

        inputSelection.on('change', configObj.onFunc);
}

var fovInput = makeInput( {
    label : 'f/#',
    shortName : 'fnum',
    initialValue : 2.2,
    onFunc : function(){
                var self = this;
                cameras.forEach( function(x){
                    x['Focal ratio (f/#)'] = Number(self.value);
                    x['Telescope aperture (mm)'] = Number(x['Focal ratio (f/#)']) * Number(x['Focal length (mm)']);
                    updateDependentParameters(x);
                })
                updateTable();
            }
});

var focalLengthInput = makeInput( {
    label : 'Focal Length (mm)',
    shortName : 'focalLength',
    initialValue : 620,
    onFunc : function(){
                var self = this;
                cameras.forEach( function(x){
                    x['Focal length (mm)'] = Number(self.value);
                    updateDependentParameters(x);
                })
                updateTable();
            }
});

var focalLengthInput = makeInput( {
    label : 'Avg. Seeing (arcsec)',
    shortName : 'avgSeeing',
    initialValue : 1.5,
    onFunc : function(){
                var self = this;
                cameras.forEach( function(x){
                    x['average seeing (arcsecs)'] = Number(self.value);
                    updateDependentParameters(x);
                })
                updateTable();
            }
});


// add a drop-down selector for which cameras to keep

d3.select('#controlDiv')
    .append('div')
    .attr('id','cameraSelectorDiv')

d3.select('#cameraSelectorDiv')
    .append('div')
    .text('Select Cameras to Chart')    

var cameraSelector = d3.select('#cameraSelectorDiv')
    .append('select')
    .attr('id','cameraSelector')
    .attr('multiple','true');

cameras.forEach(function(entry){
    cameraSelector.append('option').property('value', entry['Andor Camera']).text(entry['Andor Camera'])
})

d3.select("#cameraSelector")
 .on("change",function(d){ 
    activeCameras = [];
    selected = d3.select(this) // select the select
      .selectAll("option:checked")  // select the selected values
      .each(function() { activeCameras.push(this.value) }); // for each of those, get its value
    updateTable();  
})  


function updateDependentParameters(x){
        x['FOV, \xB0, x'] = Number(x['CCD size (mm), x']) / Number(x['Focal length (mm)']);
        x['FOV, \xB0, y'] = Number(x['CCD size (mm), y']) / Number(x['Focal length (mm)']);
        x['FOV (arcmins), x'] = 3439 * Number(x['CCD size (mm), x'])/Number(x['Focal length (mm)']);
        x['FOV (arcmins), y'] = 3439 * Number(x['CCD size (mm), y'])/Number(x['Focal length (mm)']);
        x['Image scale (arcsecs/pixel)'] = Number(x['Pixel size (\u03BCm)']) * 206.265 / Number(x['Focal length (mm)']) ;
        x['Image size in telescope focal plane (mm), x'] =  Number(x['Focal length (mm)']) * Math.tan( Number(x['FOV (arcmins), x']) * Math.PI /(60*180));
        x['Image size in telescope focal plane (mm), y'] =  Number(x['Focal length (mm)']) * Math.tan( Number(x['FOV (arcmins), y']) * Math.PI /(60*180));
        x['calculated CCD size (K), x'] =  Number(x['Image size in telescope focal plane (mm), x']) / Number(x['Pixel size (\u03BCm)']);
        x['calculated CCD size (K), y'] =  Number(x['Image size in telescope focal plane (mm), y']) / Number(x['Pixel size (\u03BCm)']);
        x['approx. minimum pixel size (\u03BCm) to avoid oversampling'] = (Number(x['average seeing (arcsecs)']) * x['Focal length (mm)'] / 206.265 ) / 2;
        x['d of image (mm) - for SQUARE sensor'] = x['Image size in telescope focal plane (mm), x'] * Math.sqrt(2);
        x['d of image (mm) for rectangular sensor'] = Math.sqrt( x['Image size in telescope focal plane (mm), x']**2 + x['Image size in telescope focal plane (mm), y']**2 ) ;
        return;
};