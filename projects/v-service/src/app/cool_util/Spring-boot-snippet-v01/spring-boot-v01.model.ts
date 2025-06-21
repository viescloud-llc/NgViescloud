/**
 * {0} package name
 * {1} uppercase entity name
 * {2} lowercase entity name
 * {3} id field data type
 * {4} id field name lowercase
 * {5} id field name uppercase
 */

export interface Field
{
  dataType?: string;
  name?: string;
}

const ENTITY = `package {0}.model;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "{2}")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class {1} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private {3};

{6}
}
`;

const DAO = `package {0}.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import {0}.model.{1};

public interface {1}Dao extends JpaRepository<{1}, {6}> {
{7}
}`;

const SERVICE = `package {0}.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import org.springframework.data.domain.Example;
import {0}.dao.{1}Dao;
import {0}.model.{1};
import {0}.util.DatabaseUtils;
import {0}.util.ReflectionUtils;
import {0}.util.Http.HttpResponseThrowers;

@Service
public class {1}Service {
    public static final String HASH_KEY = "{0}.service.{1}Service";

    private DatabaseUtils<{1}, {3}> databaseUtils;

    private {1}Dao {2}Dao;

    public {1}Service(DatabaseUtils<{1}, {3}> databaseUtils, {1}Dao {2}Dao) {
        this.databaseUtils = databaseUtils.init({2}Dao, HASH_KEY);
        this.{2}Dao = {2}Dao;
    }

    public List<{1}> getAll() {
        return this.{2}Dao.findAll();
    }

    public {1} getBy{5}({3} {4}) {
        {1} {2} = this.databaseUtils.getAndExpire({4});

        if (ObjectUtils.isEmpty({2}))
            HttpResponseThrowers.throwBadRequest("{1} {5} not found");

        return {2};
    }

    public {1} tryGetBy{5}({3} {4}) {
        {1} {2} = this.databaseUtils.getAndExpire({4});
        return {2};
    }

    public List<{1}> getAllByMatchAll({1} {2}) {
        Example<{1}> example = ReflectionUtils.getMatchAllMatcher({2});
        return this.{2}Dao.findAll(example);
    }

    public List<{1}> getAllByMatchAny({1} {2}) {
        Example<{1}> example = ReflectionUtils.getMatchAnyMatcher({2});
        return this.{2}Dao.findAll(example);
    }

    public List<{1}> getAllByMatchAll({1} {2}, String matchCase) {
        Example<{1}> example = ReflectionUtils.getMatchAllMatcher({2}, matchCase);
        return this.{2}Dao.findAll(example);
    }

    public List<{1}> getAllByMatchAny({1} {2}, String matchCase) {
        Example<{1}> example = ReflectionUtils.getMatchAnyMatcher({2}, matchCase);
        return this.{2}Dao.findAll(example);
    }

    public {1} create{1}({1} {2}) {
        {1} new{1} = new {1}();
        ReflectionUtils.patchValue(new{1}, {2});
        new{1} = this.databaseUtils.saveAndExpire(new{1});
        return new{1};
    }

    public {1} modify{1}({3} {4}, {1} {2}) {
        {1} old{1} = this.getBy{5}({4});

        ReflectionUtils.replaceValue(old{1}, {2});

        old{1} = this.databaseUtils.saveAndExpire(old{1});

        return old{1};
    }

    public {1} patch{1}({3} {4}, {1} {2}) {
        {1} old{1} = this.getBy{5}({4});

        ReflectionUtils.patchValue(old{1}, {2});

        old{1} = this.databaseUtils.saveAndExpire(old{1});

        return old{1};
    }

    public void delete{1}({3} {4}) {
        this.databaseUtils.deleteBy{5}({4});
    }
}`;

const CONTROLLER = `package {0}.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

import jakarta.ws.rs.QueryParam;
import io.swagger.v3.oas.annotations.Operation;

import {0}.model.{1};
import {0}.service.{1}Service;

@RestController
@RequestMapping("/{2}s")
public class {1}Controller {
    @Autowired
    private {1}Service {2}Service;

    @Operation(summary = "Get a list of all {1}")
    @GetMapping
    public ResponseEntity<List<{1}>> getAll() {
        List<{1}> {2}s = {2}Service.getAll();

        if ({2}s.isEmpty())
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);

        return new ResponseEntity<>({2}s, HttpStatus.OK);
    }

    @Operation(summary = "Get {1} base on {4} in path variable")
    @GetMapping("{{4}}")
    public ResponseEntity<{1}> getBy{5}(@PathVariable("{4}") {3} {4}) {
        {1} {2} = {2}Service.getBy{5}({4});

        return new ResponseEntity<>({2}, HttpStatus.OK);
    }

    @Operation(summary = "Get a list of all {1} that match all information base on query parameter")
    @GetMapping("match_all")
    public ResponseEntity<List<{1}>> matchAll(@QueryParam("{2}") {1} {2}) {
        List<{1}> {2}s = this.{2}Service.getAllByMatchAll({2});

        if ({2}s.isEmpty())
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);

        return new ResponseEntity<>({2}s, HttpStatus.OK);
    }

    @Operation(summary = "Get a list of all {1} that match any information base on query parameter")
    @GetMapping("match_any")
    public ResponseEntity<List<{1}>> matchAny(@QueryParam("{2}") {1} {2}) {
        List<{1}> {2}s = this.{2}Service.getAllByMatchAny({2});

        if ({2}s.isEmpty())
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);

        return new ResponseEntity<>({2}s, HttpStatus.OK);
    }

    @Operation(summary = "Get a list of all {1} that match all information base on query parameter and match case")
    @GetMapping("match_all/{matchCase}")
    public ResponseEntity<List<{1}>> matchAll(@QueryParam("{2}") {1} {2},
            @PathVariable("matchCase") String matchCase) {
        List<{1}> {2}s = this.{2}Service.getAllByMatchAll({2}, matchCase);

        if ({2}s.isEmpty())
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);

        return new ResponseEntity<>({2}s, HttpStatus.OK);
    }

    @Operation(summary = "Get a list of all {1} that match any information base on query parameter and match case")
    @GetMapping("match_any/{matchCase}")
    public ResponseEntity<List<{1}>> matchAny(@QueryParam("{2}") {1} {2},
            @PathVariable("matchCase") String matchCase) {
        List<{1}> {2}s = this.{2}Service.getAllByMatchAny({2}, matchCase);

        if ({2}s.isEmpty())
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);

        return new ResponseEntity<>({2}s, HttpStatus.OK);
    }

    @Operation(summary = "Create a new {1}")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<{1}> create(@RequestBody {1} {2}) {
        {1} saved{1} = {2}Service.create{1}({2});
        return new ResponseEntity<>(saved{1}, HttpStatus.CREATED);

    }

    @Operation(summary = "Modify a {1} base on {4} in path variable")
    @PutMapping("{{4}}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<{1}> update(@PathVariable("{4}") {3} {4}, @RequestBody {1} {2}) {
        {2} = this.{2}Service.modify{1}({4}, {2});
        return new ResponseEntity<>({2}, HttpStatus.OK);
    }

    @Operation(summary = "Patch a {1} base on {4} in path variable")
    @PatchMapping("{{4}}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<{1}> patch(@PathVariable("{4}") {3} {4}, @RequestBody {1} {2}) {
        {2} = this.{2}Service.patch{1}({4}, {2});
        return new ResponseEntity<>({2}, HttpStatus.OK);
    }

    @Operation(summary = "Delete a {1} base on {4} in path variable")
    @DeleteMapping("{{4}}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<HttpStatus> delete(@PathVariable("{4}") {3} {4}) {
        {2}Service.delete{1}({4});
        return new ResponseEntity<>(HttpStatus.OK);
    }
}`

export const SPRINGBOOT_CLASS_V01 = {ENTITY: ENTITY, DAO: DAO, SERVICE: SERVICE, CONTROLLER: CONTROLLER}
