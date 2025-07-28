const advancedResults = (model, populate) => async (req, res, next) => {
    let query;

    const reqQuery = { ...req.query };

 
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'genres', 'releaseYear', 'yearRange', 'rating'];

    const searchTerm = reqQuery.search;
    const sort = reqQuery.sort;
    const genres = reqQuery.genres;
    const releaseYear = reqQuery.releaseYear;
    const yearRange = reqQuery.yearRange;
    const rating = reqQuery.rating; 

    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    let filter = JSON.parse(queryStr);

    if (searchTerm) {
        const searchRegex = { $regex: searchTerm, $options: 'i' };
        filter.$or = [
            { title: searchRegex },
            { originalTitle: searchRegex },
        ];
    }

    if (genres) {
        const genresArray = genres.split(',');
        filter['genres.name'] = { $in: genresArray };
    }

    if (releaseYear && !yearRange) {
        const year = parseInt(releaseYear, 10);
        if (!isNaN(year)) {
            const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
            const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
            filter.releaseDate = { $gte: startDate, $lte: endDate };
        }
    }


    if (yearRange) {
        const [startYear, endYear] = yearRange.split('-').map(Number);
        if (!isNaN(startYear) && !isNaN(endYear)) {
            const startDate = new Date(`${startYear}-01-01T00:00:00.000Z`);
            const endDate = new Date(`${endYear}-12-31T23:59:59.999Z`);
            filter.releaseDate = { $gte: startDate, $lte: endDate };
        }
    }

   
    if (rating) {
        const [gte, lte] = rating.split('-').map(Number);
        if (!isNaN(gte) || !isNaN(lte)) {
            filter.voteAverage = {};
            if (!isNaN(gte)) filter.voteAverage.$gte = gte;
            if (!isNaN(lte)) filter.voteAverage.$lte = lte;
        }
    }


    query = model.find(filter);

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (sort) {
        const sortBy = sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-popularity');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const total = await model.countDocuments(filter);

    query = query.skip(startIndex).limit(limit);

    if (populate) {
        query = query.populate(populate);
    }

    const results = await query;

    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        total,
        pagination,
        data: results
    };

    next();
};

module.exports = advancedResults;