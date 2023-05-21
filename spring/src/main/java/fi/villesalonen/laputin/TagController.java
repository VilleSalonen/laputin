package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.TagEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TagController {
    private final TagRepository tagRepo;

    @Autowired
    public TagController(TagRepository tagRepo) {
        this.tagRepo = tagRepo;
    }

    @GetMapping("/tags")
    public List<TagEntity> listAll() {
        List<TagEntity> tags = tagRepo.findAll();
        return tags;
    }
}
