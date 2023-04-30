const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname,"covid19India.db");
let db = null;

const initializeDBAndServer = async() =>{
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3000, ()=>{
            console.log("Server is running at http://localhost:3000/")
        });
    } catch (error) {
        console.log(`DBError: ${error.message}`);
        process.exit(1);
        )
    }
};
initializeDBAndServer();

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population
  };
};

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths
  };
};

const convertSnakeToCamelCase = (dbObject) => {
  return {
    
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths
  };
};


app.get("/states/",async(request,response)=>{
    const getStateQuery = 
    `SELECT * FROM state ORDERBY state_id`
    const stateName = await db.all(getStateQuery);
    const stateQuery = stateName.map((eachName)=>{
        return convertStateObjectToResponseObject(eachName)
    });
    response.send(stateQuery);
});

app.get("/states/:stateId/", async(request,response)=>{
    const {stateId} = request.params;
    const getStateQuery = 
    `SELECT * FROM state WHERE state_id = "${stateId}`
    const stateName = await db.get(getStateQuery);
    const stateQuery = convertStateObjectToResponseObject(stateName);
    response.send(stateQuery);
});

app.post("/districts/",async(request,response)=>{
    const districtDetails = request.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    } = districtDetails;
    const postDistrictQuery = 
    `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES ("${districtName}","${stateId}","${cases}","${cured}","${active}","${deaths}")`
    const newDistrict = await.db.run(postDistrictQuery);
    const districtId = newDistrict.lastId
    response.send("District Successfully Added");
});

app.get("/districts/:districtId/",async(request,response)=>{
    const {districtId} = request.params;
    const getDistrictQuery = 
    `SELECT * FROM district WHERE district_id = "${districtId}`
    const districtName = await db.get(getDistrictQuery);
    const districtQuery = convertDistrictObjectToResponseObject(districtName);
    response.send(districtQuery);
});

app.delete("/districts/:districtId/",async(request,response)=>{
    const {districtId} = request.params;
    const deleteDistrictQuery = 
    `DELETE FROM district WHERE district_id = "${districtId}"`
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
});

app.put("/districts/:districtId/",async(request,response)=>{
    const {districtId} = request.params
    const districtDetails = request.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    } = districtDetails;
    const putDistrictQuery = 
    `UPDATE 
        district 
    SET 
        district_name = "${districtName}",
        state_id = "${stateId}",
        cases = "${cases}",
        cured = "${cured}",
        active = "${active}",
        deaths = "${deaths}"
    WHERE district_id = "${districtId}"`;
    await db.run(putDistrictQuery);
    response.send("District Details Updated");
});

app.get("/states/:stateId/stats/",async(request,response)=>{
    const {stateId} = request.params;
    const getStateQuery = 
    `SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = "${stateId}"`
    const stateName = await db.get(getStateQuery);
    const stateQuery = convertSnakeToCamelCase(stateName)
    response.send(stateQuery);

});



app.get("/districts/:districtId/details/",async (request, response) => {
const { districtId } = request.params;
const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`;
const getDistrictIdQueryResponse =await db.get(getDistrictIdQuery);

const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`;
const getStateNameQueryResponse =await db.get(getStateNameQuery);
response.send(getStateNameQueryResponse);});


module.exports = app;
