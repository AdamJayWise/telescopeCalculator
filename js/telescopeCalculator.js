// ok it would be cool to have a table where relationships are enforced
// e.g., all values are related through some formula, and if you change one of them it updates the rest?
// or would it be better to have a list of inputs, and then change a small number of updateable fields?
// I think that'd be easier to pop out quick -
// so I'd want to make a table that corresponds to a JSON-built object
// and you'll enter telescope aperature and focal length AND (?) focal ratio?

console.log('Telescope Calculator');

// alphabetically sort list of cameras to start
cameras.sort( function(a,b){
    if (a['Andor Camera'].toUpperCase() > b['Andor Camera'].toUpperCase()){
        return 1;
    }
    else{return -1}
    });

var activeCameras = ['Marana']; // list of active cameras

var ascending = 1; // should table be sorted as ascending?

var cameraLUT = {}
cameras.forEach(function(entry){
    cameraLUT[entry['Andor Camera']] = entry;
})

// table headers
var headers = ['Andor Camera', 'Telescope Aperture (mm)', 'Focal Ratio (f/#)',
'Focal Length (mm)', 'CCD Size (mm)_xy', 'Pixel Size (\u03BCm)',
'FOV (\xB0)_xy', 'FOV (arcmin)_xy',
'Image Scale (arcsec/pixel)', 'Calculated CCD Size (K)_xy',
'Telescope Focal Plane Image Size (mm)_xy',
'Approx. Min. Pixel Size (\u03BCm) to Avoid Over Sampling',
'Average Seeing (arcsec)', 'D of Image (mm), Square Sensor',
'D of Image (mm), Rectangular Sensor'];

var headerDict = {
    'Andor Camera' : 'Andor Camera',
    'Telescope aperture (mm)' : 'Telescope Aperture (mm)',
    'Focal Ratio (f/#)' : "Focal ratio (f/#)",
    'Focal Length (mm)' : "Focal length (mm)",
    'CCD Size (mm)_xy' : "CCD size (mm), x",
    'FOV (\xB0)_xy' : "FOV, °, y",
    'Pixel Size (\u03BCm)' : "Pixel size (μm)",
    'FOV (arcmin)_xy' : "FOV (arcmins), x",
    'Image Scale (arcsec/pixel)' : "Image scale (arcsecs/pixel)",
    'Calculated CCD Size (K)_xy' : "calculated CCD size (K), x",
    'Telescope Focal Plane Image Size (mm)_xy' : "Image size in telescope focal plane (mm), y",
    'Approx. Min. Pixel Size (\u03BCm) to Avoid Over Sampling' : 'approx. minimum pixel size (μm) to avoid oversampling',
    'D of Image (mm), Square Sensor' : 'd of image (mm) - for SQUARE sensor',
    'D of Image (mm), Rectangular Sensor' : "d of image (mm) for rectangular sensor",
}

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
        var newEntry = dataTableHead.append('th')
        var headCell = newEntry.append('div').attr('class','headCell')
        headCell.append('div').text(label);
        
        headCell.attr('parameter' , label)

        headCell.on('click', function(){
            //console.log(label);
            var self = d3.select(this);
            var param = headerDict[d3.select(this).attr('parameter')];
            //console.log(this, param)
            cameras.sort( function(a,b){
                    if(Number(a[param]) > Number(b[param])){
                        return -1*ascending
                    }
                    else {return 1*ascending}
                });
                updateTable();
                ascending = ascending*-1;
            })
        
        if (colWidth > 1){
            var subHeadDiv = headCell.append('div').attr('class','xySubHeadDiv')
            subHeadDiv.append('div').text('x')
            subHeadDiv.append('div').text('y')
        }

        newEntry.attr('colspan', colWidth);
    })

    cameras.forEach(function(entry){
        if (activeCameras.indexOf(entry['Andor Camera']) != -1){
            //console.log(entry['Andor Camera'], activeCameras.indexOf(entry['Andor Camera']))
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
                        .property('value',configObj.initialValue)
                        .attr('type','text')

        inputSelection.on('change', configObj.onFunc);
}

var fnumInput = makeInput( {
    label : 'f/#',
    shortName : 'fnum',
    initialValue : 2.2,
    onFunc : function(){
                var self = this;
                cameras.forEach( function(x){
                    x['Focal ratio (f/#)'] = Number(self.value);
                    x['Telescope aperture (mm)'] =  Number(x['Focal length (mm)']) / Number(x['Focal ratio (f/#)']) ;
                    d3.select('#apertureInput').property('value', Math.round( 1000* Number(x['Telescope aperture (mm)']))/1000);
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
                    x['Focal ratio (f/#)'] = Number(x['Focal length (mm)']) / Number(x['Telescope aperture (mm)']);
                    d3.select('#fnumInput').property('value', Math.round( 1000* Number(x['Focal ratio (f/#)']))/1000);
                    updateDependentParameters(x);
                })
                updateTable();
            }
});

var apInput = makeInput( {
    label : 'Telescope Aperture (mm)',
    shortName : 'aperture',
    initialValue : 279,
    onFunc : function(){
                var self = this;
                cameras.forEach( function(x){
                    x['Telescope aperture (mm)'] = Number(self.value);
                    x['Focal ratio (f/#)'] = x['Focal length (mm)'] / x['Telescope aperture (mm)'];
                    d3.select('#fnumInput').property('value', Math.round( 1000* Number(x['Focal ratio (f/#)']))/1000);
                    updateDependentParameters(x);
                })
                updateTable();
            }
});

var seeingInput = makeInput( {
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
        return null;
};
